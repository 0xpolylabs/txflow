import type { EnvironmentProviders, Provider } from '@angular/core'
import { InjectionToken, makeEnvironmentProviders } from '@angular/core'

export const WINDOW = new InjectionToken<typeof window>('window')
export const NAVIGATOR = new InjectionToken<typeof navigator>('navigator')
export const LOCAL_STORAGE = new InjectionToken<typeof localStorage>('localStorage')
export const SESSION_STORAGE = new InjectionToken<typeof sessionStorage>('sessionStorage')

export const browserProviders: Provider[] = [
  {
    provide: WINDOW,
    useValue: window,
  },
  {
    provide: NAVIGATOR,
    useValue: navigator,
  },
  {
    provide: LOCAL_STORAGE,
    useValue: localStorage,
  },
  {
    provide: SESSION_STORAGE,
    useValue: sessionStorage,
  },
]

export function provideBrowserAPI(): EnvironmentProviders {
  return makeEnvironmentProviders(browserProviders)
}
