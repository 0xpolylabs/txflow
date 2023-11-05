import { inject, Injectable } from '@angular/core'
import { from, Observable, of, throwError } from 'rxjs'
import { catchError, concatMap, map, switchMap, tap } from 'rxjs/operators'
import { SignerLoginOpts, Subsigner } from '../signer-login-options'
import { BrowserProvider, JsonRpcSigner, toQuantity } from 'ethers'
import { PreferenceService, WalletProvider } from '../../../store/preference.service'
import { Network, Networks } from '../../utils/networks'
import { WINDOW } from '../../providers/browser.provider'
import { EIP6963ProviderDetail } from '../wallet-discovery.service'


@Injectable({
  providedIn: 'root',
})
export class MetamaskSubsignerService implements Subsigner<MetamaskLoginOpts> {
  private readonly preferenceService = inject(PreferenceService)
  private readonly window = inject(WINDOW)

  eip1193Provider = undefined

  subprovider!: BrowserProvider

  login(opts: MetamaskLoginOpts): Observable<JsonRpcSigner> {
    this.eip1193Provider = opts.eip6963ProviderDetail?.provider ?? this.window.ethereum

    return this.registerMetamask().pipe(
      switchMap(() => this.loginGetAddress(opts).pipe(
        tap(address => {
          this.preferenceService.set('walletAddress', address.toLowerCase())
          this.preferenceService.set('walletProvider', opts.eip6963ProviderDetail?.info.rdns ?? WalletProvider.METAMASK)
        }),
      )),
      switchMap(() => this.subprovider.getSigner()),
    )
  }

  // TODO: refactor to work when feature is needed
  // watchAsset(assetAddress: string): Observable<boolean> {
  //     return of(ERC20__factory.connect(assetAddress, this.subprovider.getSigner())).pipe(
  //         switchMap(contract => of(contract).pipe(
  //             switchMap(contract => combineLatest([contract.decimals(), contract.symbol()])),
  //             map(([decimals, symbol]) => ({
  //                 type: 'ERC20',
  //                 options: {
  //                     address: assetAddress,
  //                     decimals,
  //                     symbol,
  //                 },
  //             } as WatchAssetParams)),
  //             switchMap(params => from(this.subprovider.getSigner()).pipe(
  //                 switchMap(signer => signer.provider.send('wallet_watchAsset', [params])),
  //             )),
  //         )),
  //     )
  // }

  logout(): Observable<unknown> {
    return of(undefined)
  }

  switchEthereumChain(opts: MetamaskLoginOpts = {}): Observable<unknown> {
    if (!opts.wantedNetworkChainID) return throwError(() => 'NO_WANTED_NETWORK_CHAIN_ID')

    return from(this.subprovider.getSigner()).pipe(
      switchMap(signer => {
        const chainId = toQuantity(opts.wantedNetworkChainID!.toString())

        return signer.provider.send('wallet_switchEthereumChain', [{chainId}])
      }),
      catchError(err => {
        switch (err.code) {
          case 4001:
            return throwError(() => 'USER_DISMISSED_POPUP')
          // TODO: wait for issue fix: https://github.com/MetaMask/metamask-mobile/issues/3312
          // case 4902:
          //   return this.addEthereumChain().pipe(
          //     concatMap(() => this.checkChainID(opts)),
          //   )
          // default:
          //   return throwError(() => 'UNHANDLED_SWITCH_CHAIN_ERROR')
          default:
            return this.addEthereumChain(opts)
        }
      }),
    ).pipe(catchError(() => throwError(() => 'CANNOT_SWITCH_CHAIN')))
  }

  private registerMetamask(): Observable<JsonRpcSigner> {
    return of(this.eip1193Provider).pipe(
      concatMap(browserProvider => browserProvider ?
        of(new BrowserProvider(browserProvider, 'any')).pipe(
          switchMap(subprovider => {
            this.subprovider = subprovider

            return this.subprovider.getSigner()
          }),
        ) : throwError(() => 'NO_METAMASK')),
    )
  }

  private checkChainID(opts: MetamaskLoginOpts) {
    if (opts.avoidNetworkChange) return of(undefined)

    return from(this.subprovider.getSigner()).pipe(
      switchMap(signer => signer.provider.getNetwork()),
      concatMap(chainID => chainID.chainId === this.preferenceService.get('chainID')() ?
        of(chainID) : opts.force ? this.switchEthereumChain(opts) : of(undefined),
      ),
    )
  }

  private addEthereumChain(opts: MetamaskLoginOpts) {
    return from(this.subprovider.getSigner()).pipe(
      switchMap(signer => signer.provider.send('wallet_addEthereumChain',
        [MetamaskNetworks[opts.wantedNetworkChainID!.toString()]])),
      concatMap(addChainResult => addChainResult === null ?
        of(addChainResult) : throwError(() => 'CANNOT_CHANGE_NETWORK')))
  }

  private loginGetAddress(opts: MetamaskLoginOpts): Observable<string> {
    return from(this.subprovider.getSigner()).pipe(
      switchMap(signer => signer.getAddress()),
      catchError(() => opts.force ? this.ethRequestAccounts().pipe(
        map(addresses => addresses?.[0]),
      ) : throwError(() => 'NO_ADDRESS')),
      concatMap(address => address ? of(address) : throwError(() => 'NO_ADDRESS')),
      concatMap(address => opts.wallet ? (
        opts.wallet === address ? of(address) : throwError(() => 'WRONG_ADDRESS')
      ) : of(address)),
    )
  }

  private ethRequestAccounts() {
    return from(this.subprovider.getSigner()).pipe(
      switchMap(signer => signer.provider.send('eth_requestAccounts', [])),
    )
  }
}

interface MetamaskLoginOpts extends SignerLoginOpts {
  wallet?: string;
  wantedNetworkChainID?: bigint;
  avoidNetworkChange?: boolean;
  eip6963ProviderDetail?: EIP6963ProviderDetail;
}

/**
 * Interface from wallet_watchAsset request parameters.
 * Source: https://docs.metamask.io/guide/rpc-api.html#wallet-watchasset
 * Last date accessed: 20211227
 */
interface WatchAssetParams {
  type: 'ERC20'; // In the future, other standards will be supported
  options: {
    address: string; // The address of the token contract
    symbol: string; // A ticker symbol or shorthand, up to 5 characters
    decimals: number; // The number of token decimals
    image: string; // A string url of the token logo
  };
}

/**
 * Interface from wallet_addEthereumChain response.
 * Source: https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
 * Last date accessed: 20211227
 */
interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

const getMetamaskNetwork = (network: Network): AddEthereumChainParameter => ({
  chainId: toQuantity(network.chainID),
  chainName: network.name,
  nativeCurrency: {
    name: network.nativeCurrency.name,
    symbol: network.nativeCurrency.symbol,
    decimals: 18,
  },
  rpcUrls: network.rpcURLs,
  blockExplorerUrls: network.explorerURLs,
})

export const MetamaskNetworks = Object.fromEntries(Object.entries(Networks)
  .map((entry) => [entry[0], getMetamaskNetwork(entry[1])]),
)
