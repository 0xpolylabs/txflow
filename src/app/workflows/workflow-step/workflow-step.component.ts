import { ChangeDetectorRef, Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { WithStatusPipe } from '../../shared/pipes/with-status.pipe'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { WorkflowService } from '../../shared/services/workflow.service'
import { distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs/operators'
import { combineLatest, EMPTY, from, Observable, of, shareReplay, take } from 'rxjs'
import { Step, Workflow } from '../../shared/interfaces/workflow'
import { AsyncActionComponent } from '../../shared/modules/async-action/async-action.component'
import { SignerService } from '../../shared/services/signer.service'
import { PreferenceService } from '../../store/preference.service'
import { toObservable } from '@angular/core/rxjs-interop'
import { DialogService } from '../../shared/services/dialog.service'
import { ChainID, Networks } from '../../shared/utils/networks'
import { TransactionRequest } from 'ethers'
import { ErrorService } from '../../shared/services/error.service'
import { Payload, UserFlowStateService, UserSteps } from '../../store/user-flow-state'
import { ExplorerLinkComponent } from '../../shared/components/explorer-link/explorer-link.component'
import { NetworkPipe } from '../../shared/pipes/network.pipe'
import { AddrShortPipe } from '../../shared/pipes/addr-short.pipe'
import { ValueCopyComponent } from '../../shared/components/value-copy/value-copy.component'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { WorkflowStepService } from './workflow-step.service'
import jsone from 'json-e'

@Component({
  selector: 'app-workflow-step',
  standalone: true,
  imports: [
    CommonModule, WithStatusPipe, RouterModule, AsyncActionComponent, ExplorerLinkComponent,
    NetworkPipe, AddrShortPipe, ValueCopyComponent, MatExpansionModule, MatSnackBarModule,
  ],
  templateUrl: './workflow-step.component.html',
})
export class WorkflowStepComponent {
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  private readonly workflowService = inject(WorkflowService)
  private readonly signerService = inject(SignerService)
  private readonly preferenceService = inject(PreferenceService)
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly dialogService = inject(DialogService)
  private readonly errorService = inject(ErrorService)
  private readonly userflowStateService = inject(UserFlowStateService)
  private readonly matSnackBar = inject(MatSnackBar)
  private readonly workflowStepService = inject(WorkflowStepService)

  workflow$: Observable<Workflow> = this.route.params.pipe(
    map(params => params['id']), distinctUntilChanged(),
    switchMap(id => this.workflowService.getWorkflow(id)),
    shareReplay(1),
  )

  stepNumber$: Observable<number> = this.route.params.pipe(map(params => Number(params['step'])))

  step$: Observable<Step> = combineLatest([this.workflow$, this.stepNumber$]).pipe(
    switchMap(([workflow, step]) => {
      try {
        return of(workflow.steps[step - 1])
      } catch (e) {
        this.router.navigate([`../1`], {relativeTo: this.route, queryParamsHandling: 'merge'})
        return EMPTY
      }
    }),
  )

  executeStep$ = (): Observable<unknown> => {
    return this.step$.pipe(take(1)).pipe(
      switchMap(stepTemplate => combineLatest([
        this.signerService.ensureNetwork(BigInt(stepTemplate.chain_id)),
        this.stepContext$.pipe(take(1)),
      ]).pipe(
        switchMap(([signer, stepContext]) => {
          let step: Step
          try {
            step = jsone(stepTemplate, stepContext)
          } catch (e: any) {
            this.dialogService.error({
              message: `Error while parsing step template: ${e.message}`,
            })
            throw e
          }

          const tx = {
            chainId: step.chain_id,
            ...(step.to ? {to: step.to} : {}),
            ...(step.value ? {value: step.value} : {}),
            ...(step.data ? {data: step.data} : {}),
          } as TransactionRequest

          return this.dialogService.waitingApproval(this.signerService.sendTransaction(tx)).pipe(
            switchMap(tx => {
              this.userflowStateService.updateState({
                address: signer.address,
                flowCID: this.route.snapshot.params['id'],
                stepNumber: this.route.snapshot.params['step'],
                payload: {
                  txHash: tx.hash,
                },
              })

              return this.dialogService.waitingTransaction({
                  obs$: from(signer.provider.waitForTransaction(tx.hash)).pipe(
                    this.errorService.handleError(),
                  ),
                  network: Networks[Number(step.chain_id) as ChainID],
                  tx: tx.hash,
                },
              )
            }),
            tap(() => {
              this.matSnackBar.open('Step finished successfully!', undefined, {
                duration: 2000, verticalPosition: 'bottom',
              })
            }),
          )
        }),
      )),
    )
  }

  address$: Observable<string> = toObservable(this.preferenceService.get('walletAddress')).pipe(
    tap(() => this.cdr.markForCheck()),
    map(v => v as string),
    distinctUntilChanged(),
  )

  userFlowState$: Observable<UserSteps | undefined> = combineLatest([
    this.address$,
    this.route.params.pipe(map(params => params['id'])),
    this.userflowStateService.stateUpdate$,
  ]).pipe(
    switchMap(([addr, flowCID]) => this.userflowStateService.state$(addr, flowCID)),
  )

  currentStoreStep$: Observable<Partial<Payload> | undefined> = combineLatest([
    this.userFlowState$,
    this.stepNumber$,
  ]).pipe(
    map(([userFlowState, stepNumber]) => userFlowState?.[stepNumber]),
  )

  stepResult$ = combineLatest([
    this.currentStoreStep$,
    this.signerService.chainChanged$.pipe(startWith(undefined)),
    this.signerService.signer$,
  ]).pipe(
    switchMap(([currentStep, _chainChange, signer]) => {
      if (!currentStep || !signer) return of(undefined)

      const tx = currentStep.txHash
      if (!tx) return of(undefined)

      return this.step$.pipe(
        switchMap(step => this.signerService.ensureNetwork(BigInt(step.chain_id)).pipe(
          switchMap(signer => {
            return from(signer.provider.waitForTransaction(tx)).pipe(
              tap(txReceipt => {
                if (txReceipt?.status !== 1) return

                const state = this.userflowStateService.state(signer.address, this.route.snapshot.params['id'])
                if (state[this.route.snapshot.params['step']]?.success) return

                this.userflowStateService.updateState({
                  address: signer.address,
                  flowCID: this.route.snapshot.params['id'],
                  stepNumber: this.route.snapshot.params['step'],
                  payload: {
                    success: true,
                    txReceipt: txReceipt,
                  },
                })

                this.workflowStepService.addLog(`Step ${this.route.snapshot.params['step']} finished successfully.`)
              }),
            )
          }),
        )),
      )
    }),
  )

  isPreviousStepDone$: Observable<boolean> = combineLatest([
    this.stepNumber$,
    this.userFlowState$,
  ]).pipe(
    map(([stepNumber, userFlowState]) => {
      if (stepNumber === 1) {
        return true
      }

      if (!userFlowState) return false

      const previousStep = userFlowState[stepNumber - 1]
      if (!previousStep) return false

      return !!previousStep.success
    }),
    startWith(false),
  )

  enableExecute$ = combineLatest([
    this.currentStoreStep$,
    this.stepResult$,
    this.isPreviousStepDone$,
  ]).pipe(
    map(([tx, result, isPreviousStepDone]) => isPreviousStepDone && (!tx || (result && result?.status !== 1))),
    startWith(false),
  )

  workflowCompleted$ = combineLatest([
    this.userFlowState$,
    this.workflow$,
  ]).pipe(
    map(([userFlowState, workflow]) => {
      if (!userFlowState) return false

      return userFlowState[workflow.steps.length]?.success
    }),
  )

  login$ = () => {
    return this.signerService.ensureAuth
  }

  resetWorkflowState$ = () => {
    return combineLatest([
      this.address$,
    ]).pipe(
      tap(([address]) => {
        this.userflowStateService.resetState({
          address: address,
          flowCID: this.route.snapshot.params['id'],
        })
        this.workflowStepService.addLog(`Workflow state has been reset.`)

        this.router.navigate(['../1'], {relativeTo: this.route, queryParamsHandling: 'merge'})
      }),
      tap(() => this.matSnackBar.open('The progress has been cleared.', undefined, {
        duration: 2000, verticalPosition: 'bottom',
      })),
    )
  }

  stepContext$: Observable<StepContext> = combineLatest([
    this.workflow$,
    this.stepNumber$,
    this.step$,
    this.address$,
    this.userFlowState$,
  ]).pipe(
    map(([workflow, stepNumber, step, userAddress, userFlowState]) => {
      const previousStepState = userFlowState?.[stepNumber - 1]

      return {
        workflow,
        stepNumber,
        step,
        userAddress,
        userFlowState,
        previousStepState,
      } as StepContext
    }),
  )

  workflowRequest$ = this.workflowStepService.request$
}

interface StepContext {
  workflow: Workflow
  stepNumber: number
  step: Step
  userAddress: string
  userFlowState: UserSteps | undefined
  previousStepState: Partial<Payload> | undefined
}
