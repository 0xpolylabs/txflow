import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core'
import { combineLatest, from, merge, Observable, of, shareReplay } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { ChainID, Network, Networks } from '../../utils/networks'
import { SignerService } from '../../services/signer.service'
import { SessionService } from '../../../store/session.service'
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
  private readonly sessionService = inject(SessionService)
  private readonly preferenceService = inject(PreferenceService)
  private readonly metamaskSubsignerService = inject(MetamaskSubsignerService)
  private readonly dialogRef = inject(MatDialogRef<WrongNetworkComponent>)
  private readonly matDialogData: WrongNetworkComponentData = inject(MAT_DIALOG_DATA)
  private readonly cdr = inject(ChangeDetectorRef)

  currentNetwork$: Observable<Partial<Network> | undefined> = merge(
    this.signerService.chainChanged$,
    from(this.sessionService.signer!.provider.getNetwork()).pipe(map(net => net.chainId)),
  ).pipe(
    map(chainId => Networks[Number(chainId) as ChainID] || {chainID: Number(chainId)} as Network),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  requestedNetwork$ = of(Networks[Number(this.matDialogData.chainID) as ChainID] || {chainID: Number(this.matDialogData.chainID)} as Network)

  isConnectedWithMetamask$: Observable<boolean> = combineLatest([
    this.signerService.injectedWeb3$,
    toObservable(this.preferenceService.get('walletProvider')),
  ]).pipe(
    map(([ethereum, walletProvider]) =>
      !!(ethereum as any).isMetaMask && walletProvider === WalletProvider.METAMASK,
    ),
  )

  dismissDialog$ = combineLatest([
    this.currentNetwork$,
    of(this.matDialogData.chainID),
  ]).pipe(
    tap(([currentNetwork, wantedNetwork]) => {
      if (currentNetwork && BigInt(currentNetwork.chainID!) === wantedNetwork) this.dialogRef.close(true)
    }),
  )

  logout$ = () => {
    return this.signerService.logout().pipe(
      tap(() => this.dialogRef.close(false)),
    )
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
  chainID: bigint
}