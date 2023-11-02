import { inject, Injectable } from '@angular/core'
import { EMPTY, Observable, of, take } from 'rxjs'
import { catchError, concatMap, timeout } from 'rxjs/operators'
import { PreferenceService, WalletProvider } from '../../store/preference.service'
import { SignerService } from './signer.service'
import { MetamaskSubsignerService } from './subsigners/metamask-subsigner.service'
import { JsonRpcSigner } from 'ethers'

@Injectable({
  providedIn: 'root',
})
export class InitializerService {
  private readonly signerService = inject(SignerService)
  private readonly metamaskSubsignerService = inject(MetamaskSubsignerService)
  private readonly preferenceService = inject(PreferenceService)

  initSigner(): Observable<unknown> {
    return this.tryPreviousLogin.pipe(
      timeout(30_000),
      catchError((err) => {
        if (err === 'WRONG_NETWORK') return of(this)

        return this.signerService.logout().pipe(concatMap(() => EMPTY))
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
          default:
            return of(undefined)
        }
      }),
    )
  }
}
