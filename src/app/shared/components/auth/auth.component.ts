import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { defer, Observable, of } from 'rxjs'
import { filter, tap } from 'rxjs/operators'
import { MatDialogRef } from '@angular/material/dialog'
import { WINDOW } from '../../providers/browser.provider'
import { SignerService } from '../../services/signer.service'
import { MetamaskSubsignerService } from '../../services/subsigners/metamask-subsigner.service'
import { AsyncActionModule } from '../../modules/async-action/async-action.module'
import { CommonModule } from '@angular/common'
import { PreferenceService } from '../../../store/preference.service'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AsyncActionModule],
  standalone: true,
})
export class AuthComponent {
  private readonly window = inject(WINDOW)
  private readonly signer = inject(SignerService)
  private readonly metamaskSubsignerService = inject(MetamaskSubsignerService)
  private readonly preferenceService = inject(PreferenceService)
  private readonly dialogRef = inject(MatDialogRef<AuthComponent>, {optional: true})

  injectedWeb3$: Observable<any> = defer(() => of((this.window as any)?.ethereum))

  afterLoginActions() {
    this.dialogRef?.close(true)
  }

  connectMetamask$ = (): Observable<unknown> => {
    return this.signer.login(this.metamaskSubsignerService).pipe(
      tap(() => this.afterLoginActions()),
    )
  }

  constructor() {
    toObservable(this.preferenceService.get('walletAddress')).pipe(
      filter(address => !!address),
      tap(() => this.dialogRef?.close(true)),
      takeUntilDestroyed(),
    ).subscribe()
  }
}
