import { create as ipfsCreate } from 'ipfs-http-client'
import { from, Observable, switchMap } from 'rxjs'
import { IPFSAddResult, IPFSApiService } from './ipfs.service.types'
import { map } from 'rxjs/operators'

export class IpfsHttpApiService implements IPFSApiService {
  readonly gatewayUrl = 'http://localhost:8080'

  private readonly apiURL = 'http://localhost:5001'
  private readonly client = ipfsCreate({url: this.apiURL})

  addFile(file: File): Observable<IPFSAddResult> {
    return from(this.client.add(file)).pipe(
      switchMap(res => this.pinToIPFS(res)),
    )
  }

  addObject(data: object): Observable<IPFSAddResult> {
    return from(this.client.add(JSON.stringify(data))).pipe(
      switchMap(res => this.pinToIPFS(res)),
    )
  }

  private pinToIPFS(data: IPFSAddResult): Observable<IPFSAddResult> {
    return from(this.client.pin.add(data.path)).pipe(
      map(() => data),
    )
  }
}
