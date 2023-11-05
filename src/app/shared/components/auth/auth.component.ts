import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { filter, tap } from 'rxjs/operators'
import { MatDialogRef } from '@angular/material/dialog'
import { SignerService } from '../../services/signer.service'
import { MetamaskSubsignerService } from '../../services/subsigners/metamask-subsigner.service'
import { AsyncActionModule } from '../../modules/async-action/async-action.module'
import { CommonModule } from '@angular/common'
import { PreferenceService } from '../../../store/preference.service'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { EIP6963ProviderDetail, WalletDiscoveryService } from '../../services/wallet-discovery.service'
import { of } from 'rxjs'
import { WINDOW } from '../../providers/browser.provider'
import { WalletConnectSubsignerService } from '../../services/subsigners/walletconnect-subsigner.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AsyncActionModule],
  standalone: true,
})
export class AuthComponent {
  private readonly signer = inject(SignerService)
  private readonly window = inject(WINDOW)
  private readonly metamaskSubsignerService = inject(MetamaskSubsignerService)
  private readonly walletConnectSubsignerService = inject(WalletConnectSubsignerService)
  private readonly preferenceService = inject(PreferenceService)
  private readonly walletDiscoveryService = inject(WalletDiscoveryService)
  private readonly dialogRef = inject(MatDialogRef<AuthComponent>, {optional: true})

  readonly wallets$ = this.walletDiscoveryService.discover$()
  readonly injectedWeb3$ = of(this.window.ethereum)

  constructor() {
    toObservable(this.preferenceService.get('walletAddress')).pipe(
      filter(address => !!address),
      tap(() => this.dialogRef?.close(true)),
      takeUntilDestroyed(),
    ).subscribe()
  }

  connect$ = (wallet: EIP6963ProviderDetail) => {
    return () => {
      return this.signer.login(this.metamaskSubsignerService, {
        eip6963ProviderDetail: wallet,
      }).pipe(
        tap(() => this.afterLoginActions()),
      )
    }
  }

  connectInjectedWeb3$ = () => {
    return this.signer.login(this.metamaskSubsignerService).pipe(
      tap(() => this.afterLoginActions()),
    )
  }

  connectWalletConnect$ = () => {
    return this.signer.login(this.walletConnectSubsignerService).pipe(
      tap(() => this.afterLoginActions()),
    )
  }

  afterLoginActions() {
    this.dialogRef?.close(true)
  }
}
