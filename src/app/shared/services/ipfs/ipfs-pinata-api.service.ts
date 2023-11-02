import { Observable } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { IPFSAddResult, IPFSApiService } from './ipfs.service.types'
import { inject } from '@angular/core'

export class IpfsPinataApiService implements IPFSApiService {
  private readonly http = inject(HttpClient)

  gatewayUrl = 'https://txflow.mypinata.cloud'

  readonly pinataApiURL = 'https://api.pinata.cloud'
  readonly pinataApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmYjQzOWVjOC0wZmFhLTQzYjgtOGM1OS1kY2MyM2VlYmIwZTMiLCJlbWFpbCI6ImZpbGlwQGFtcG5ldC5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjowfV0sInZlcnNpb24iOjEsImxhc3RfbWlncmF0ZWQiOjE2Mjg3NzQxNTAwNzR9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIyOWU0NTkzMWY1YThhZmJlYzBiZCIsInNjb3BlZEtleVNlY3JldCI6ImUwMzI4OWNjYmUwYTkyODZhNmEyMWM0YzEzMTFkOWJlNzc3YTJjMzAwMzQwODhhZTFmNzU1ODIwNzZiNmFmYTIiLCJpYXQiOjE2OTgzNTI3Nzd9.KYiz81lTwqVY_evndOKLOTU3Jzv6hw5ZkeHqBSRABz0'

  addFile(file: File): Observable<IPFSAddResult> {
    const formData = new FormData()
    formData.append('file', file, file.name)

    return this.pinFileToIPFS(formData)
  }

  addObject(data: object): Observable<IPFSAddResult> {
    const formData = new FormData()
    formData.append('file', new Blob([JSON.stringify(data)], {
      type: 'application/json',
    }), 'data.json')

    return this.pinFileToIPFS(formData)
  }


  private pinFileToIPFS(formData: FormData): Observable<IPFSAddResult> {
    return this.http.post<PinataPinResponse>(`${this.pinataApiURL}/pinning/pinFileToIPFS`, formData, {
      headers: {
        Authorization: `Bearer ${this.pinataApiToken}`,
      },
    }).pipe(
      map(res => ({path: res.IpfsHash, size: res.PinSize})),
    )
  }
}

interface PinataPinResponse {
  IpfsHash: string
  PinSize: number,
  Timestamp: Date
}
