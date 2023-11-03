import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-loading-dialog-approval',
  templateUrl: './loading-dialog-approval.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  standalone: true,
})
export class LoadingDialogApprovalComponent {
  readonly data = inject(MAT_DIALOG_DATA) as LoadingDialogApprovalData
}

export interface LoadingDialogApprovalData {
  title: string;
  message: string;
}
