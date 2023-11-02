import { ChangeDetectorRef, Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { AddrShortPipe } from '../../pipes/addr-short.pipe'
import { ExplorerLinkComponent } from '../explorer-link/explorer-link.component'
import { NetworkPipe } from '../../pipes/network.pipe'
import { ValueCopyComponent } from '../value-copy/value-copy.component'
import { SignerService } from '../../services/signer.service'
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { toObservable } from '@angular/core/rxjs-interop'
import { PreferenceService } from '../../../store/preference.service'
import { AsyncActionModule } from '../../modules/async-action/async-action.module'

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AddrShortPipe, ExplorerLinkComponent, NetworkPipe, ValueCopyComponent, AsyncActionModule],
  template: `
      <div class="max-w-screen-md mx-auto px-4 py-2">
          <nav class="flex justify-between items-center">
              <a routerLink="/" class="text-xl font-bold">
                  TxFlow
              </a>

              <div *ngIf="address$ | async as address" class="flex gap-0.5">
                  {{ address | addrShort }}
                  <app-value-copy [value]="address"/>
                  <app-explorer-link
                          *ngIf="(signerProviderNetwork$ | async)?.chainId | network as network"
                          [network]="network" [type]="'address'"
                          [value]="address"/>

                  <a [routerLink]="[]" class="underline" [appAsyncAction]="logout$" text="disconnect"></a>
              </div>
          </nav>

          <section class="mt-4">
              <router-outlet/>
          </section>
      </div>
  `,
  styles: [],
})
export class AppLayoutComponent {
  private readonly signerService = inject(SignerService)
  private readonly preferenceService = inject(PreferenceService)
  private readonly cdr = inject(ChangeDetectorRef)

  logout$ = () => {
    return this.signerService.logout()
  }

  signerProviderNetwork$ = this.signerService.ensureAuth.pipe(
    switchMap(signer => signer.provider.getNetwork()),
  )

  address$: Observable<string> = toObservable(this.preferenceService.get('walletAddress')).pipe(
    tap(() => this.cdr.markForCheck()),
    map(v => v as string),
    distinctUntilChanged(),
  )
}
