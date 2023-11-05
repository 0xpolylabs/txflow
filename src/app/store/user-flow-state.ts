import { Injectable } from '@angular/core'
import { createStore, select, setProp, withProps } from '@ngneat/elf'
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class UserFlowStateService {
  static readonly USER_FLOW_STORE_KEY = 'userFlowState'
  readonly store = createStore(
    {name: UserFlowStateService.USER_FLOW_STORE_KEY},
    withProps<UserFlowState>({
      state: {},
    }),
  )
  readonly persist = persistState(this.store, {
    key: UserFlowStateService.USER_FLOW_STORE_KEY,
    storage: localStorageStrategy,
  })

  state$ = (address: string, flowCID: string) => this.store.pipe(
    select(state => state.state[`${address.toLowerCase()}/${flowCID}`]),
  )

  private readonly stateUpdateSubject = new BehaviorSubject<void>(undefined)
  readonly stateUpdate$ = this.stateUpdateSubject.asObservable()

  state(address: string, flowCID: string): UserSteps {
    const key = `${address.toLowerCase()}/${flowCID}`

    return this.store.getValue().state[key]
  }

  updateState = (data: { address: string, flowCID: string, stepNumber: number, payload: Partial<Payload> }) => {
    this.store.update(setProp('state', states => {
      const {address, flowCID, stepNumber, payload} = data
      const key = `${address.toLowerCase()}/${flowCID}`

      if (!states[key]) {
        states[key] = {}
      }
      states[key][stepNumber] = {
        ...states[key][stepNumber],
        ...payload,
      }

      return states
    }))

    // workaround for issue with not signaling state
    // change on select after update.
    this.stateUpdateSubject.next()
  }

  resetState = ({address, flowCID}: { address: string, flowCID: string }) => {
    this.store.update(setProp('state', states => {
      const key = `${address.toLowerCase()}/${flowCID}`
      delete states[key]

      return states
    }))

    this.stateUpdateSubject.next()
  }
}

export interface UserFlowState {
  state: {
    // key: "address/flowCID"
    [key: string]: UserSteps
  },
}

export interface UserSteps {
  [stepIndex: number]: Partial<Payload>
}

export interface Payload {
  txHash: string,
  success: boolean,
}
