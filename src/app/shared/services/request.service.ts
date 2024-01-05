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
  LogAction,
  LogPayload,
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

  createWorkflowRequest(workflowID: string, name?: string): Observable<CreatorListRequest> {
    if (!name) {
      name = this.createRandomName()
    }

    return this.getUserAddress().pipe(
      switchMap(address => this.http.post<CreatorListRequest>(`/api/requests`, {
        action: 'createWorkflowRequest',
        name,
        creatorAddress: address,
        workflowID,
      } as CreateWorkflowRequest)),
    )
  }

  addLog(requestID: string, message: string, logAction: LogAction, payload?: Partial<LogPayload>): Observable<void> {
    return this.http.post<void>(`/api/requests`, {
      action: 'addLog',
      requestID,
      message,
      logAction,
      payload,
    } as AddLogRequest)
  }

  private getUserAddress(): Observable<string> {
    return this.signerService.ensureAuth.pipe(
      switchMap(signer => signer.getAddress()),
      map(address => address.toLowerCase()),
    )
  }

  private createRandomName(): string {
    const firstWords = [
      'Amazing', 'Awesome', 'Breathtaking', 'Cool', 'Crazy', 'Dope', 'Epic', 'Excellent', 'Extraordinary',
      'Fabulous', 'Fantastic', 'Great', 'Impressive', 'Incredible', 'Insane', 'Legendary', 'Magnificent',
      'Marvelous', 'Mind-blowing', 'Outstanding', 'Phenomenal', 'Rad', 'Remarkable', 'Sensational', 'Sick',
      'Spectacular', 'Stellar', 'Stunning', 'Super', 'Superb', 'Superior', 'Supreme', 'Terrific', 'Tremendous',
      'Unbelievable', 'Wonderful', 'Wondrous',
    ]

    const secondWords = [
      'Car', 'Cat', 'Dog', 'Elephant', 'Fish', 'Flower', 'Horse', 'House', 'Lion', 'Mountain', 'Ocean', 'Panda',
      'River', 'Robot', 'Shark', 'Snake', 'Space', 'Tiger', 'Tree', 'Unicorn', 'Whale',
      'Astronaut', 'Astronomy', 'Aurora', 'Black hole', 'Comet', 'Constellation', 'Cosmos',
    ]

    const first = firstWords[Math.floor(Math.random() * firstWords.length)]
    const second = secondWords[Math.floor(Math.random() * secondWords.length)]

    return `${first}-${second}`.toLowerCase()
  }
}
