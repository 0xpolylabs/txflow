import { inject, Injectable } from '@angular/core'
import { Observable, switchMap } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http'
import { SignerService } from './signer.service'
import {
  AddLogRequest,
  CreateWorkflowRequest,
  CreatorListRequest,
  GetSingleRequest,
  GetSingleRequestLogsRequest,
  ListForCreatorRequest,
  WorkflowRequest,
  WorkflowRequestLog,
} from '../../../../types/requests.api'

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private readonly http = inject(HttpClient)
  private readonly signerService = inject(SignerService)

  getRequestsForCreator(): Observable<CreatorListRequest[]> {
    return this.getUserAddress().pipe(
      switchMap(address => this.http.get<CreatorListRequest[]>(`/api/requests`, {
        params: {action: 'getRequestsForCreator', creatorAddress: address} as ListForCreatorRequest as any,
      })),
    )
  }

  getRequest(requestID: string): Observable<WorkflowRequest> {
    return this.http.get<WorkflowRequest>(`/api/requests`, {
      params: {action: 'getRequest', requestID} as GetSingleRequest as any,
    })
  }

  getRequestLogs(requestID: string): Observable<WorkflowRequestLog[]> {
    return this.http.get<WorkflowRequestLog[]>(`/api/requests`, {
      params: {action: 'getRequestLogs', requestID} as GetSingleRequestLogsRequest as any,
    })
  }

  createWorkflowRequest(name: string, workflowID: string): Observable<void> {
    return this.getUserAddress().pipe(
      switchMap(address => this.http.post<void>(`/api/requests`, {
        action: 'createWorkflowRequest',
        name,
        creatorAddress: address,
        workflowID,
      } as CreateWorkflowRequest)),
    )
  }

  addLog(requestID: string, message: string): Observable<void> {
    return this.http.post<void>(`/api/requests`, {
      action: 'addLog',
      requestID,
      message,
    } as AddLogRequest)
  }

  private getUserAddress(): Observable<string> {
    return this.signerService.ensureAuth.pipe(
      switchMap(signer => signer.getAddress()),
      map(address => address.toLowerCase()),
    )
  }
}
