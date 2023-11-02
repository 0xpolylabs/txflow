import { Observable } from 'rxjs'
import { InjectionToken } from '@angular/core'

export const IPFSApiService = new InjectionToken<IPFSApiService>('IPFSApiService')

export interface IPFSApiService {
  gatewayUrl?: string

  addObject(data: object): Observable<IPFSAddResult>

  addFile(file: File): Observable<IPFSAddResult>
}

export interface IPFSAddResult {
  path: string
  size: number
}
