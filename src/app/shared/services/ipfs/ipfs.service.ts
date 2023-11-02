import { inject, Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { IPFSAddResult, IPFSApiService } from './ipfs.service.types'
import { CID } from 'ipfs-http-client'

@Injectable({
  providedIn: 'root',
})
export class IpfsService {
  private readonly http = inject(HttpClient)
  private readonly ipfsApiService = inject(IPFSApiService)

  readonly defaultGatewayUrl = 'https://ipfs.io'

  toCID(value: any): CID | undefined {
    try {
      const cid = CID.parse(value)

      if (CID.asCID(cid)) return cid
    } catch (_e) {
      return undefined
    }

    return undefined
  }

  get<T>(hash: string): Observable<T> {
    const cid = this.toCID(hash)

    return cid ? this.http.get<T>(this.getURL(cid.toString())) : of(<T>{})
  }

  getURL(hash: string): string {
    return `${this.ipfsApiService.gatewayUrl ?? this.defaultGatewayUrl}/ipfs/${hash}`
  }

  addFile(file: File): Observable<IPFSAddResult> {
    return this.ipfsApiService.addFile(file)
  }

  addText(content: string): Observable<IPFSAddResult> {
    return this.addObject<IPFSText>({content})
  }

  addObject<ipfsObject>(data: ipfsObject): Observable<IPFSAddResult> {
    return this.ipfsApiService.addObject(data as unknown as object)
  }
}

export interface IPFSText {
  content: string
}
