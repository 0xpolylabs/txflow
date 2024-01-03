import { inject, Injectable } from '@angular/core'
import { EMPTY, Observable, throwError } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'
import { HttpErrorResponse } from '@angular/common/http'
import { DialogService } from './dialog.service'
import { isError } from 'ethers'

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private readonly dialogService = inject(DialogService)

  handleError(completeAfterAction = true, rethrowAfterAction = false) {
    return <T>(source: Observable<T>): Observable<T> => {
      return source.pipe(catchError(this.processError(completeAfterAction, rethrowAfterAction)))
    }
  }

  private processError<T>(completeAfterAction: boolean, rethrowAfterAction: boolean) {
    return (err: any, caught: Observable<T>) => {
      let errorRes = err as HttpErrorResponse
      let action$: Observable<any> = throwError(err)

      console.error(err)

      if (errorRes.error instanceof ErrorEvent) { // client-side error
        return action$
      } else if (err.code) {
        if (err?.message?.includes('cannot estimate gas')) {
          action$ = this.displayMessage(this.outOfGasMessage)
        } else if (err?.message?.includes('missing revert data')) {
          action$ = this.displayMessage('Unknown error')
        }
      }

      if (completeAfterAction) {
        return action$.pipe(switchMap(() => EMPTY))
      } else {
        if (rethrowAfterAction) {
          return action$.pipe(switchMap(() => throwError(() => err)))
        } else {
          return action$
        }
      }
    }
  }

  private displayMessage(message: string) {
    return this.dialogService.error({message})
  }

  private get outOfGasMessage() {
    return 'Not enough gas to execute the transaction.'
  }
}

interface EthereumRpcError<T> {
  code: number;
  message?: string;
  data?: T;
}
