import type { Signal } from '@angular/core'
import { computed, Injectable } from '@angular/core'
import { createStore, setProp, withProps } from '@ngneat/elf'
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state'
import type { Observable } from 'rxjs'
import { last, takeWhile } from 'rxjs'
import { map } from 'rxjs/operators'
import { toSignal } from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root',
})
export class PreferenceService {
  protected readonly storeKey = 'preferences'

  readonly store
  readonly persist

  private readonly preferences: Signal<PreferenceStore>

  constructor() {
    this.store = createStore(
      {name: this.storeKey},
      withProps<PreferenceStore>({
        walletAddress: '',
        walletProvider: '',
      }),
    )

    this.persist = persistState(this.store, {
      key: this.storeKey,
      storage: localStorageStrategy,
    })

    this.preferences = toSignal(this.store, {
      requireSync: true,
    })
  }


  get(key: StoreKey): Signal<StoreValue<StoreKey>> {
    return computed(() => this.preferences()[key])
  }

  set<K extends StoreKey>(key: K, value: StoreValue<K>): void {
    this.store.update(setProp(key, value))
  }

  /**
   * Set a property in the store and return an observable that emits a new value when it is set.
   * `compareFn` should be used only when the value is not comparable by default.
   *
   * @param key
   * @param value
   * @param compareFn - optional function to determine when the value has been set
   */
  readonly setSync$ = <K extends StoreKey>(
    key: K,
    value: StoreValue<K>,
    compareFn?: (a: StoreValue<K>, b: StoreValue<K>) => boolean,
  ): Observable<StoreValue<K>> => {
    this.set(key, value)

    const differentValue = (oldValue: StoreValue<K>): boolean => {
      if (compareFn) {
        return !compareFn(oldValue, value)
      }

      return oldValue !== value
    }

    return this.store.pipe(
      map(store => store[key]),
      takeWhile(oldValue => differentValue(oldValue), true),
      last(),
    )
  }
}

interface PreferenceStore {
  walletAddress: string;
  walletProvider: WalletProvider | string;
  chainID?: bigint;
}

type StoreKey = keyof PreferenceStore;
type StoreValue<K extends StoreKey> = PreferenceStore[K];

export enum WalletProvider {
  METAMASK = 'METAMASK',
}
