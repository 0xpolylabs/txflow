import { inject, Injectable, NgZone } from '@angular/core'
import { Observable, of, throwError } from 'rxjs'
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog'
import {
  DialogIcon,
  InfoDialogComponent,
  InfoDialogData,
  InfoDialogResponse,
} from '../components/info-dialog/info-dialog.component'
import { finalize, map, switchMap } from 'rxjs/operators'
import { LoadingDialogComponent, LoadingDialogData } from '../components/loading-dialog/loading-dialog.component'
import {
  LoadingDialogApprovalComponent,
  LoadingDialogApprovalData,
} from '../components/loading-dialog/loading-dialog-approval/loading-dialog-approval.component'
import {
  LoadingDialogTransactionComponent,
  LoadingDialogTransactionData,
} from '../components/loading-dialog/loading-dialog-transaction/loading-dialog-transaction.component'
import { Network } from '../utils/networks'

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly ngZone = inject(NgZone)
  readonly dialog = inject(MatDialog)

  readonly configDefaults: Partial<MatDialogConfig> = {
    minWidth: 320,
  }

  info(data: DialogData): Observable<boolean> {
    return this.dialog.open(InfoDialogComponent, {
      ...this.configDefaults,
      data: {
        icon: data.icon ?? DialogIcon.INFO,
        title: data.title ?? 'Info',
        message: data.message,
        cancelable: data.cancelable ?? true,
      } as InfoDialogData<unknown>,
      disableClose: !(data.cancelable ?? true),
    }).afterClosed().pipe(
      map(res => !!(res as InfoDialogResponse<unknown>)?.confirmed),
    )
  }

  infoWithOnConfirm<T>(data: Partial<InfoDialogData<T>>): Observable<InfoDialogResponse<T>> {
    return this.dialog.open(InfoDialogComponent, {
      ...this.configDefaults,
      data,
    }).afterClosed().pipe(
      map(res => res ?? {confirmed: false}),
    )
  }

  success(data: DialogData): Observable<void> {
    return this.dialog.open(InfoDialogComponent, {
      ...this.configDefaults,
      data: {
        icon: data.icon ?? DialogIcon.SUCCESS,
        title: data.title ?? 'Success',
        message: data.message,
        cancelable: data.cancelable ?? false,
      } as InfoDialogData<unknown>,
      disableClose: !(data.cancelable ?? false),
    }).afterClosed()
  }

  error(data: DialogData): Observable<void> {
    return this.dialog.open(InfoDialogComponent, {
      ...this.configDefaults,
      data: {
        icon: data.icon ?? DialogIcon.ERROR,
        title: data.title ?? 'Error',
        message: data.message,
        cancelable: data.cancelable ?? false,
      } as InfoDialogData<unknown>,
      disableClose: !(data.cancelable ?? false),
    }).afterClosed()
  }

  loading<T>(obs$: Observable<T>, title: string, message?: string, opts?: MatDialogConfig): Observable<T> {
    const dialogRef = this.dialog.open(LoadingDialogComponent, {
      ...this.configDefaults,
      ...opts,
      data: {title, message} as LoadingDialogData,
      disableClose: true,
      maxWidth: opts?.width,
      // panelClass: opts?.panelClass !== undefined ? opts.panelClass : 'mat-rounded-4xl',
    })

    return obs$.pipe(
      finalize(() => dialogRef.close()),
    )
  }

  waitingApproval<T>(obs$: Observable<T>, title?: string, message?: string, opts?: MatDialogConfig): Observable<T> {
    let dialogRef: MatDialogRef<LoadingDialogApprovalComponent>
    this.ngZone.run(() => {
      // running opening dialog in zone to avoid issue with rendering
      // https://stackoverflow.com/questions/56470620/ngoninit-not-firing-when-opening-dialog
      dialogRef = this.dialog.open(LoadingDialogApprovalComponent, {
        ...this.configDefaults,
        ...opts,
        data: {title, message} as LoadingDialogApprovalData,
        disableClose: true,
      })
    })

    return obs$.pipe(
      finalize(() => dialogRef.close()),
    )
  }

  waitingTransaction<T>(data: {
    obs$: Observable<T>,
    network?: Network,
    tx?: string,
    title?: string,
    message?: string,
    opts?: MatDialogConfig
  }): Observable<T> {
    const {obs$, network, tx, title, message, opts} = data
    let dialogRef: MatDialogRef<LoadingDialogTransactionComponent>
    this.ngZone.run(() => {
      dialogRef = this.dialog.open(LoadingDialogTransactionComponent, {
        ...this.configDefaults,
        ...opts,
        data: {network, tx, title, message} as LoadingDialogTransactionData,
      })
    })

    return obs$.pipe(
      finalize(() => dialogRef.close()),
    )
  }

  withPermission<A = undefined>(data: DialogPermissionData<A>) {
    return this.infoWithOnConfirm({
      icon: data.icon ?? DialogIcon.INFO,
      title: data.title ?? 'Are you sure?',
      message: data.message ?? 'Are you sure?',
      confirm_text: data.confirmText ?? 'OK',
      cancel_text: data.cancelText ?? 'Cancel',
      cancelable: true,
      onConfirm: data.onConfirmAction$ ?? of(undefined),
    }).pipe(
      switchMap(res => res.confirmed ? of(res.onConfirmResult) :
        throwError(() => 'PERMISSION_POPUP_DISMISSED')),
    )
  }
}

interface DialogData {
  icon?: DialogIcon | string
  title?: string
  message?: string
  cancelable?: boolean
}

interface DialogPermissionData<A> {
  icon?: DialogIcon | string
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirmAction$?: Observable<A>
}
