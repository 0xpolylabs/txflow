import { DestroyRef, inject, Injectable, NgZone } from '@angular/core'
import { defer, from, fromEvent, merge, Observable, of, ReplaySubject, take, takeWhile, throwError, timer } from 'rxjs'
import { concatMap, delay, finalize, map, switchMap, tap } from 'rxjs/operators'
import { DialogService } from './dialog.service'
import { GetSignerOptions, SignerLoginOpts, Subsigner } from './signer-login-options'
import { WINDOW } from '../providers/browser.provider'
import { SessionService } from '../../store/session.service'
import { ErrorService } from './error.service'
import { AuthComponent } from '../components/auth/auth.component'
import { BytesLike, JsonRpcApiProvider, JsonRpcSigner, TransactionRequest, TransactionResponse } from 'ethers'
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
  private readonly sessionService = inject(SessionService)
  private readonly preferenceService = inject(PreferenceService)
  private readonly destroyRef = inject(DestroyRef)

  injectedWeb3$: Observable<any> = defer(() => of(this.window.ethereum))

  private subsigner?: Subsigner<any>
  private accountsChangedSub = new ReplaySubject<string[]>(1)
  private chainChangedSub = new ReplaySubject<string>(1)
  private disconnectedSub = new ReplaySubject<void>(1)
  private listenersSub = new ReplaySubject<JsonRpcApiProvider>(1)

  accountsChanged$ = this.accountsChangedSub.asObservable()
  chainChanged$ = this.chainChangedSub.asObservable()
  disconnected$ = this.disconnectedSub.asObservable()

  listeners$ = this.listenersSub.asObservable().pipe(
    switchMap(() => merge(
      fromEvent<string>(this.window.ethereum, 'chainChanged').pipe(
        switchMap(chainID => timer(200, 0).pipe(
          switchMap(() => from(this.sessionService.signer!.provider.getNetwork())),
          takeWhile(network => network.chainId.toString() !== chainID),
          map(() => chainID),
          take(1),
        )),
        tap(chainID => this.chainChangedSub.next(chainID)),
      ),
      fromEvent<string[]>(this.window.ethereum, 'accountsChanged').pipe(
        tap(accounts => this.accountsChangedSub.next(accounts)),
      ),
      fromEvent<void>(this.window.ethereum, 'disconnect').pipe(
        map(() => this.disconnectedSub.next()),
      ),
    )),
    tap(action => this.ngZone.run(() => {
      this.sessionService.signer!.provider.getNetwork()
    })),
  )

  constructor() {
    this.subscribeToChanges()
  }

  get ensureAuth(): Observable<JsonRpcSigner> {
    return of(this.sessionService.signer).pipe(
      concatMap(signer => signer ?
        of(signer) :
        this.loginDialog.pipe(
          concatMap(() => this.ensureAuth),
        ),
      ),
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
        this.sessionService.waitUntilLoggedIn$() :
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
        this.sessionService.update({signer: undefined})
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

  registerListeners(): void {
    const provider = this.sessionService.signer?.provider as any
    this.listenersSub.next(provider)
  }

  private setSigner(signer: JsonRpcSigner): void {
    this.sessionService.update({
      signer,
    })
    this.registerListeners()
  }

  private subscribeToChanges(): void {
    this.accountsChanged$.pipe(
      tap(accounts => {
        if (accounts[0]) {
          this.preferenceService.set('walletAddress', accounts[0].toLowerCase())
        }
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe()

    this.listeners$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe()
  }
}
