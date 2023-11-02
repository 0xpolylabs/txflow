import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { LoadingDialogData } from '../loading-dialog.component'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import { CommonModule } from '@angular/common'
import { Network } from '../../../utils/networks'
import { ExplorerLinkComponent } from '../../explorer-link/explorer-link.component'

@Component({
  selector: 'app-loading-dialog-transaction',
  templateUrl: './loading-dialog-transaction.component.html',
  styleUrls: ['./loading-dialog-transaction.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ExplorerLinkComponent],
  standalone: true,
})
export class LoadingDialogTransactionComponent implements OnInit {
  private readonly data = inject(MAT_DIALOG_DATA, {optional: true}) as LoadingDialogTransactionData
  private dataSub = new BehaviorSubject<LoadingDialogData & LoadingDialogTransactionData>({
    title: 'Processing...',
    message: '',
  })
  data$ = this.dataSub.asObservable()

  ngOnInit(): void {
    if (!this.data) {
      return
    }

    this.dataSub.next({
      network: this.data.network || this.dataSub.value.network,
      tx: this.data.tx || this.dataSub.value.tx,
      title: this.data.title || this.dataSub.value.title,
      message: this.data.message || this.dataSub.value.message,
    })
  }
}

export interface LoadingDialogTransactionData {
  network?: Network;
  tx?: string;
  title: string;
  message: string;
}
