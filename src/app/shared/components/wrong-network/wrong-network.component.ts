import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { combineLatest, from, merge, Observable, of, shareReplay, switchMap } from 'rxjs'
import { distinctUntilChanged, map, tap } from 'rxjs/operators'
import { ChainID, Network, Networks } from '../../utils/networks'
import { SignerService } from '../../services/signer.service'
import { MetamaskSubsignerService } from '../../services/subsigners/metamask-subsigner.service'
import { PreferenceService, WalletProvider } from '../../../store/preference.service'
import { toObservable } from '@angular/core/rxjs-interop'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { CommonModule } from '@angular/common'
import { AsyncActionModule } from '../../modules/async-action/async-action.module'

@Component({
  selector: 'app-wrong-network',
  templateUrl: './wrong-network.component.html',
  styleUrls: ['./wrong-network.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AsyncActionModule],
  standalone: true,
})
export class WrongNetworkComponent {
  private readonly signerService = inject(SignerService)
  private readonly preferenceService = inject(PreferenceService)
  private readonly metamaskSubsignerService = inject(MetamaskSubsignerService)
  private readonly dialogRef = inject(MatDialogRef<WrongNetworkComponent>)
  private readonly matDialogData: WrongNetworkComponentData = inject(MAT_DIALOG_DATA)

  currentNetwork$: Observable<Partial<Network> | undefined> = merge(
    this.signerService.chainChanged$,
    this.signerService.signer$.pipe(
      switchMap(signer => signer ?
        from(signer.provider.getNetwork()).pipe(map(net => net?.chainId))
        : of(undefined)),
    ),
  ).pipe(
    distinctUntilChanged(),
    map(chainId => Networks[Number(chainId) as ChainID] || {chainID: Number(chainId)} as Network),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  requestedNetwork$ = of(Networks[Number(this.matDialogData.chainID) as ChainID] || {chainID: Number(this.matDialogData.chainID)} as Network)

  isConnectedWithMetamask$: Observable<boolean> = combineLatest([
    this.signerService.injectedWeb3$,
    toObservable(this.preferenceService.get('walletProvider')),
  ]).pipe(
    map(([ethereum, walletProvider]) =>
      !!ethereum.isMetaMask && walletProvider === WalletProvider.METAMASK,
    ),
  )

  readonly dismissDialog$ = combineLatest([
    this.currentNetwork$,
    of(this.matDialogData.chainID),
    this.signerService.signer$,
  ]).pipe(
    tap(([currentNetwork, wantedNetwork, signer]) => {
      if (!signer) {
        this.dialogRef.close(false)
        return
      }

      if (currentNetwork && currentNetwork.chainID!.toString() === wantedNetwork) {
        this.dialogRef.close(true)
        return
      }
    }),
  )

  logout$ = () => {
    return this.signerService.logout()
  }

  changeNetwork$ = (chainID: number) => {
    return () => {
      return this.metamaskSubsignerService.switchEthereumChain({
        wantedNetworkChainID: BigInt(chainID),
      })
    }
  }
}

export interface WrongNetworkComponentData {
  chainID: string
}