import { inject, Injectable } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { RequestService } from '../../shared/services/request.service'
import { map, switchMap } from 'rxjs/operators'
import { Observable, of } from 'rxjs'
import { WorkflowRequest } from '../../../../types/requests.api'

@Injectable({
  providedIn: 'root',
})
export class WorkflowStepService {
  private readonly route = inject(ActivatedRoute)
  private readonly requestService = inject(RequestService)

  addLog(message: string) {
    const requestID = this.route.snapshot.queryParams['requestID']
    if (!requestID) return

    this.requestService.addLog(requestID, message).subscribe()
  }

  request$: Observable<WorkflowRequest | undefined> = this.route.queryParams.pipe(
    map(params => params['requestID']),
    switchMap(requestID => requestID ? this.requestService.getRequest(requestID) : of(undefined)),
  )
}
