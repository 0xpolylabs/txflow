import { inject, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { WINDOW } from '../providers/browser.provider'

@Injectable({
  providedIn: 'root',
})
export class WalletDiscoveryService {
  private readonly window = inject(WINDOW) as Window & WalletDiscoveryWindow

  /**
   * Implements EIP-6963 Multi Injected Provider Discovery
   * source: https://eips.ethereum.org/EIPS/eip-6963
   */
  discover$(timeoutLimit = 100): Observable<EIP6963ProviderDetail[]> {
    return new Observable<EIP1193Provider[]>(subscriber => {
      const providers: EIP1193Provider[] = []

      const onAnnounceProvider = (event: EIP6963AnnounceProviderEvent) => {
        providers.push(event.detail)
        subscriber.next(providers)
      }

      this.window.addEventListener('eip6963:announceProvider', onAnnounceProvider)
      this.window.dispatchEvent(new Event('eip6963:requestProvider'))

      setTimeout(() => {
        if (providers.length === 0) {
          subscriber.next([])
        }
        subscriber.complete()
      }, timeoutLimit)

      return () => this.window.removeEventListener('eip6963:announceProvider', onAnnounceProvider)
    })
  }
}

interface WalletDiscoveryWindow {
  addEventListener(event: 'eip6963:announceProvider', listener: (event: EIP6963AnnounceProviderEvent) => void): void;

  removeEventListener(event: 'eip6963:announceProvider', listener: (event: EIP6963AnnounceProviderEvent) => void): void;
}

/**
 * Represents the assets needed to display a wallet
 */
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

type EIP1193Provider = any

// Announce Event dispatched by a Wallet
interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

// Request Event dispatched by a DApp
interface EIP6963RequestProviderEvent extends Event {
  type: 'eip6963:requestProvider';
}
