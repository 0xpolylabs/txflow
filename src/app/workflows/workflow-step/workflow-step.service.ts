import { inject, Injectable } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { RequestService } from '../../shared/services/request.service'
import { map, startWith } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class WorkflowStepService {
  private readonly route = inject(ActivatedRoute)
  private readonly requestService = inject(RequestService)

  getRequestID() {
    return this.route.snapshot.queryParams['requestID']
  }

  addLog(message: string) {
    const requestID = this.getRequestID()
    if (!requestID) return

    this.requestService.addLog(requestID, message).subscribe()
  }
}
