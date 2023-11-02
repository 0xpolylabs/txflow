import { inject, Injectable } from '@angular/core'
import { IpfsService } from './ipfs/ipfs.service'
import { Observable } from 'rxjs'
import { Workflow } from '../interfaces/workflow'
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private readonly ipfsService = inject(IpfsService)

  getWorkflow(id: string): Observable<Workflow> {
    return this.ipfsService.get<Workflow>(id)
  }

  uploadWorkflow(jsonConfig: string): Observable<IPFSHash> {
    const config = JSON.parse(jsonConfig)

    return this.ipfsService.addObject(config).pipe(
      map(res => res.path),
    )
  }
}

export type IPFSHash = string
