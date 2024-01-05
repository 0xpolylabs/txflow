import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { AddrShortPipe } from '../../pipes/addr-short.pipe'
import { ExplorerLinkComponent } from '../explorer-link/explorer-link.component'
import { NetworkPipe } from '../../pipes/network.pipe'
import { ValueCopyComponent } from '../value-copy/value-copy.component'
import { SignerService } from '../../services/signer.service'
import { switchMap } from 'rxjs/operators'
import { PreferenceService } from '../../../store/preference.service'
import { AsyncActionModule } from '../../modules/async-action/async-action.module'

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AddrShortPipe, ExplorerLinkComponent, NetworkPipe, ValueCopyComponent, AsyncActionModule],
  template: `
      <div class="bg-gray-200">
          <p class="text-sm leading-tight max-w-screen-md mx-auto px-4 py-2">
              Check out <a class="underline" href="https://txflow.gitbook.io/docs" target="_blank">docs</a> for more
              information.
          </p>
      </div>
      <div class="max-w-screen-md mx-auto px-4 py-2">
          <nav class="flex justify-between items-center">
              <a routerLink="/" class="text-xl font-bold">
                  TxFlow
              </a>

              <div *ngIf="address$ | async as address" class="flex items-baseline gap-0.5 border rounded-full p-0.5">
                  <span class="pl-2 pr-1 font-mono text-sm">{{ address | addrShort }}</span>
                  <app-value-copy [value]="address"/>
                  <app-explorer-link
                          *ngIf="(signerProviderNetwork$ | async)?.chainId | network as network"
                          [network]="network" [type]="'address'"
                          [value]="address"/>

                  <div class="w-px h-4 self-center mx-1 my-1 bg-gray-400"></div>

                  <a [routerLink]="[]" [appAsyncAction]="logout$">
                      <ng-template appAsyncActionReady appAsyncActionLoading>
                          <span class="flex items-center p-1.5 bg-gray-200 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5"
                                   stroke="currentColor" class="w-3 h-3">
                                  <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"/>
                              </svg>
                          </span>
                      </ng-template>
                  </a>
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

  logout$ = () => {
    return this.signerService.logout()
  }

  signerProviderNetwork$ = this.signerService.ensureAuth.pipe(
    switchMap(signer => signer.provider.getNetwork()),
  )

  address$ = this.preferenceService.address$()
}
