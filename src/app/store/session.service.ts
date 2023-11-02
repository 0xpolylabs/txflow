import { Injectable } from '@angular/core'
import { createStore, select, withProps } from '@ngneat/elf'
import { JsonRpcSigner } from 'ethers'
import { filter, map } from 'rxjs/operators'
import { Observable, take } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly store = createStore(
    {name: 'session'},
    withProps<SessionStore>({
      signer: undefined,
    }),
  )

  update(store: Partial<SessionStore>) {
    this.store.update((oldStore) => ({...oldStore, ...store}))
  }

  signer$ = this.store.pipe(select((state) => state.signer))

  get signer() {
    return this.store.getValue().signer
  }

  isLoggedIn$ = this.store.pipe(
    map(state => !!state.signer),
  )

  waitUntilLoggedIn$(): Observable<boolean> {
    return this.isLoggedIn$.pipe(filter(isLoggedIn => isLoggedIn), take(1))
  }
}

interface SessionStore {
  signer: JsonRpcSigner | undefined;
}
