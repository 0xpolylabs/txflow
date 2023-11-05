import { inject, Injectable } from '@angular/core'
import { Observable, of, take } from 'rxjs'
import { catchError, concatMap, filter, map, timeout } from 'rxjs/operators'
import { PreferenceService, WalletProvider } from '../../store/preference.service'
import { SignerService } from './signer.service'
import { MetamaskSubsignerService } from './subsigners/metamask-subsigner.service'
import { JsonRpcSigner } from 'ethers'
import { WalletDiscoveryService } from './wallet-discovery.service'
import { WalletConnectSubsignerService } from './subsigners/walletconnect-subsigner.service'

@Injectable({
  providedIn: 'root',
})
export class InitializerService {
  private readonly signerService = inject(SignerService)
  private readonly walletDiscoveryService = inject(WalletDiscoveryService)
  private readonly metamaskSubsignerService = inject(MetamaskSubsignerService)
  private readonly walletConnectSubsignerService = inject(WalletConnectSubsignerService)
  private readonly preferenceService = inject(PreferenceService)

  initSigner(): Observable<unknown> {
    return this.tryPreviousLogin.pipe(
      timeout(30_000),
      catchError(() => {
        return this.signerService.logout().pipe(concatMap(() => of(undefined)))
      }),
    )
  }

  private get tryPreviousLogin(): Observable<JsonRpcSigner | undefined> {
    return this.preferenceService.store.pipe(
      take(1),
      concatMap(pref => {
        if (pref.walletAddress === '') {
          return of(undefined)
        }

        switch (pref.walletProvider) {
          case WalletProvider.METAMASK:
            return this.signerService.login(this.metamaskSubsignerService, {force: false})
          case WalletProvider.WALLET_CONNECT:
            return this.signerService.login(this.walletConnectSubsignerService, {force: false})
          default:
            return this.walletDiscoveryService.discover$().pipe(
              map(wallets => wallets.find(wallet => wallet.info.rdns === pref.walletProvider)),
              filter(wallet => !!wallet), take(1),
              concatMap(wallet => {
                return this.signerService.login(this.metamaskSubsignerService, {
                  eip6963ProviderDetail: wallet!,
                  force: false,
                })
              }),
            )
        }
      }),
    )
  }
}
