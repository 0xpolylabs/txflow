import { inject, Injectable } from '@angular/core'
import { EMPTY, from, Observable, of, switchMap, throwError } from 'rxjs'
import { concatMap, map, tap } from 'rxjs/operators'
import { SignerLoginOpts, Subsigner } from '../signer-login-options'
import { switchMapTap } from '../../utils/observables'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { BrowserProvider, JsonRpcSigner } from 'ethers'
import { PreferenceService, WalletProvider } from '../../../store/preference.service'

@Injectable({
  providedIn: 'root',
})
export class WalletConnectSubsignerService implements Subsigner<WalletConnectLoginOpts> {
  private readonly preferenceService = inject(PreferenceService)

  wcProvider: EthereumProvider | undefined
  eip1193Provider: any

  private get freshWalletConnectProvider(): Observable<EthereumProvider> {
    return from(
      import(
        /* webpackChunkName: "@walletconnect/ethereum-provider" */
        '@walletconnect/ethereum-provider')).pipe(
      switchMap((lib) => lib.EthereumProvider.init({
        projectId: 'ea1890fa3940a3d7c251a9cecf67c59b',
        chains: [1],
        showQrModal: true,

        qrModalOptions: {
          themeVariables: {
            // Raise the z-index of the modal because it's being hidden by the
            // z-index of MatDialog.
            // @ts-ignore
            '--wcm-z-index': '1000',
          },
        },
      })),
      map(wcProvider => {
        this.wcProvider = wcProvider
        this.eip1193Provider = wcProvider

        // TODO: using this for debugging purposes. remove after finished with investigation.
        // [
        //   'connect', 'disconnect', 'session_update', 'session_request',
        //   'call_request', 'wc_sessionRequest', 'wc_sessionUpdate',
        // ].forEach(e => {
        //   this.wcProvider?.connector.on(e, (...args: any[]) => {
        //     console.log(e, 'payload', args)
        //   })
        // })
        // getWindow().wcc = this.wcProvider

        return this.wcProvider
      }),
    )
  }

  login(opts: WalletConnectLoginOpts): Observable<JsonRpcSigner> {
    return this.freshWalletConnectProvider.pipe(
      switchMapTap(p => from(p.enable())),
      concatMap(p => p.accounts && p.accounts.length > 0 ?
        of(p) : throwError(() => 'UNABLE TO CONNECT')),
      tap(p => {
        if (opts.force) {
          this.preferenceService.set('walletAddress', p.accounts[0])
          this.preferenceService.set('walletProvider', WalletProvider.WALLET_CONNECT)
        }
      }),
      switchMap(p => new BrowserProvider(p as any, 'any').getSigner()),
    )
  }

  logout(): Observable<unknown> {
    return from(this.wcProvider ? this.wcProvider.disconnect() : EMPTY)
  }
}

interface WalletConnectLoginOpts extends SignerLoginOpts {
  wallet?: string;
}
