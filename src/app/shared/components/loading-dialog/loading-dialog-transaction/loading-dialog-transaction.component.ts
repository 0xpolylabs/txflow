import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import { CommonModule } from '@angular/common'
import { Network } from '../../../utils/networks'
import { ExplorerLinkComponent } from '../../explorer-link/explorer-link.component'

@Component({
  selector: 'app-loading-dialog-transaction',
  templateUrl: './loading-dialog-transaction.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ExplorerLinkComponent],
  standalone: true,
})
export class LoadingDialogTransactionComponent {
  readonly data = inject(MAT_DIALOG_DATA, {optional: true}) as LoadingDialogTransactionData
}

export interface LoadingDialogTransactionData {
  network?: Network;
  tx?: string;
  title: string;
  message: string;
}
