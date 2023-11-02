import { Pipe, PipeTransform } from '@angular/core'
import { BigNumberish } from 'ethers'
import { ChainID, Network, Networks } from '../utils/networks'

@Pipe({
  name: 'network',
  standalone: true,
})
export class NetworkPipe implements PipeTransform {
  transform<T>(chainID: BigNumberish | null | undefined): Network | undefined {
    return Networks[chainID as ChainID] ?? undefined
  }
}
