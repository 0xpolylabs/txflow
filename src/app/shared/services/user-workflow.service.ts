import { inject, Injectable } from '@angular/core'
import { Observable, switchMap } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http'
import { SignerService } from './signer.service'
import { AddWorkflowData, GetListQuery, WorkflowID } from '../../../../types/my-workflows.api'

@Injectable({
  providedIn: 'root',
})
export class UserWorkflowService {
  private readonly http = inject(HttpClient)
  private readonly signerService = inject(SignerService)

  getWorkflows(): Observable<WorkflowID[]> {
    return this.getUserAddress().pipe(
      switchMap(address => this.http.get<WorkflowID[]>(`/api/myworkflows`, {
        params: {creatorAddress: address} as GetListQuery as any,
      })),
    )
  }

  addWorkflow(workflowID: string): Observable<void> {
    return this.getUserAddress().pipe(
      switchMap(address => this.http.post<void>(`/api/myworkflows`, {
        creatorAddress: address,
        workflowID,
      } as AddWorkflowData)),
    )
  }

  private getUserAddress(): Observable<string> {
    return this.signerService.ensureAuth.pipe(
      switchMap(signer => signer.getAddress()),
      map(address => address.toLowerCase()),
    )
  }
}
