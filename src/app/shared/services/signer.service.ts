import { inject, Injectable, NgZone } from '@angular/core'
import {
  BehaviorSubject,
  defer,
  from,
  fromEvent,
  merge,
  Observable,
  of,
  ReplaySubject,
  take,
  takeWhile,
  throwError,
  timer,
} from 'rxjs'
import { concatMap, filter, finalize, map, switchMap, tap } from 'rxjs/operators'
import { DialogService } from './dialog.service'
import { GetSignerOptions, SignerLoginOpts, Subsigner } from './signer-login-options'
import { WINDOW } from '../providers/browser.provider'
import { ErrorService } from './error.service'
import { AuthComponent } from '../components/auth/auth.component'
import { BytesLike, JsonRpcSigner, TransactionRequest, TransactionResponse } from 'ethers'
import { WrongNetworkComponent, WrongNetworkComponentData } from '../components/wrong-network/wrong-network.component'
import { PreferenceService } from '../../store/preference.service'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

declare global {
  interface Window {
    ethereum: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SignerService {
  private readonly window = inject(WINDOW)
  private readonly ngZone = inject(NgZone)
  private readonly dialogService = inject(DialogService)
  private readonly errorService = inject(ErrorService)
  private readonly preferenceService = inject(PreferenceService)

  injectedWeb3$: Observable<any> = defer(() => of(this.window.ethereum))

  private subsigner?: Subsigner<any>
  private readonly accountsChangedSub = new ReplaySubject<string[]>(1)
  private readonly chainChangedSub = new ReplaySubject<string>(1)
  private readonly disconnectedSub = new ReplaySubject<void>(1)
  private readonly setListenersSub = new ReplaySubject<void>(1)

  accountsChanged$ = this.accountsChangedSub.asObservable()
  chainChanged$ = this.chainChangedSub.asObservable()
  disconnected$ = this.disconnectedSub.asObservable()

  private readonly signerSub = new BehaviorSubject<JsonRpcSigner | undefined>(undefined)
  readonly signer$ = this.signerSub.asObservable()

  constructor() {
    this.setListenersSub.asObservable().pipe(
      switchMap(() => merge(
        fromEvent<string>(this.window.ethereum, 'chainChanged').pipe(
          switchMap(chainID => this.waitUntilNetworkChanged$(chainID)),
          tap(chainID => this.chainChangedSub.next(chainID)),
        ),
        fromEvent<string[]>(this.window.ethereum, 'accountsChanged').pipe(
          tap(accounts => this.accountsChangedSub.next(accounts)),
        ),
        fromEvent<void>(this.window.ethereum, 'disconnect').pipe(
          map(() => this.disconnectedSub.next()),
        ),
      )),
      tap(() => this.ngZone.run(() => {
      })),
    ).pipe(
      takeUntilDestroyed(),
    ).subscribe()

    this.accountsChanged$.pipe(
      tap(accounts => {
        if (accounts[0]) {
          this.preferenceService.set('walletAddress', accounts[0].toLowerCase())
        }
      }),
      takeUntilDestroyed(),
    ).subscribe()
  }

  get ensureAuth(): Observable<JsonRpcSigner> {
    return this.signer$.pipe(
      concatMap(signer => signer ?
        of(signer) :
        this.loginDialog.pipe(
          concatMap(() => this.ensureAuth),
        ),
      ),
      // getting a fresh signer in case user changed addresses (metamask)
      switchMap(signer => signer.provider.getSigner()),
      take(1),
    )
  }

  ensureNetwork(chainID: bigint): Observable<JsonRpcSigner> {
    return this.ensureAuth.pipe(
      switchMap(signer => from(signer.provider.getNetwork())),
      map(network => network.chainId === chainID),
      concatMap(isCorrectNetwork => isCorrectNetwork ?
        of(true) :
        this.changeNetworkDialog(chainID),
      ),
      concatMap(() => this.ensureAuth),
    )
  }

  private get loginDialog() {
    return this.dialogService.dialog.open(AuthComponent, {
      ...this.dialogService.configDefaults,
    }).afterClosed().pipe(
      concatMap(authCompleted => authCompleted ?
        this.waitUntilLoggedIn$() :
        throwError(() => 'LOGIN_MODAL_DISMISSED')),
    )
  }

  private changeNetworkDialog(chainID: bigint) {
    return this.dialogService.dialog.open<
      WrongNetworkComponent, WrongNetworkComponentData
    >(WrongNetworkComponent, {
      ...this.dialogService.configDefaults,
      data: {
        chainID: chainID.toString(),
      },
    }).afterClosed().pipe(
      switchMap(changeNetworkCompleted => changeNetworkCompleted ?
        of(true) : throwError(() => 'CHANGE_NETWORK_MODAL_DISMISSED')),
    )
  }

  login<S extends Subsigner<any>, O extends GetSignerOptions<S>>(
    subsigner: S, opts: O | SignerLoginOpts = {},
  ): Observable<JsonRpcSigner> {
    (opts as SignerLoginOpts).force ??= true

    this.subsigner = subsigner
    return this.subsigner.login(opts).pipe(
      tap(signer => this.setSigner(signer)),
    )
  }

  logout(): Observable<unknown> {
    const logout$ = this.subsigner ? this.subsigner.logout() : of(undefined)

    return logout$.pipe(
      finalize(() => {
        this.signerSub.next(undefined)
        this.preferenceService.set('walletAddress', '')
        this.preferenceService.set('walletProvider', '')
      }),
    )
  }

  getAddress(): Observable<string> {
    return this.ensureAuth.pipe(
      switchMap(signer => from(signer.getAddress())),
    )
  }

  signMessage(message: string | BytesLike): Observable<string> {
    return this.ensureAuth.pipe(
      switchMap(signer => from(signer.signMessage(message))),
      this.errorService.handleError(false, true),
    )
  }

  sendTransaction(transaction: TransactionRequest):
    Observable<TransactionResponse> {
    return this.ensureAuth.pipe(
      switchMap(signer => from(signer.sendTransaction(transaction))),
      this.errorService.handleError(false, true),
    )
  }

  private setSigner(signer: JsonRpcSigner): void {
    this.signerSub.next(signer)
    this.setListenersSub.next()
  }

  isLoggedIn$ = this.signer$.pipe(
    map(signer => !!signer),
  )

  waitUntilLoggedIn$(): Observable<boolean> {
    return this.isLoggedIn$.pipe(filter(isLoggedIn => isLoggedIn), take(1))
  }

  private waitUntilNetworkChanged$(chainID: string): Observable<string> {
    return timer(200, 0).pipe(
      switchMap(() => this.signer$.pipe(take(1))),
      switchMap(signer => signer ? from(signer.provider.getNetwork()) : of(undefined)),
      takeWhile(network => network?.chainId.toString() !== chainID),
      map(() => chainID),
      take(1),
    )
  }
}
