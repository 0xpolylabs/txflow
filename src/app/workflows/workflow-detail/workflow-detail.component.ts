import { Component, inject } from '@angular/core'
import { CommonModule, JsonPipe } from '@angular/common'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { map, switchMap } from 'rxjs/operators'
import { WorkflowService } from '../../shared/services/workflow.service'
import { WithStatusPipe } from '../../shared/pipes/with-status.pipe'
import { MatExpansionModule } from '@angular/material/expansion'
import { WorkflowStepService } from '../workflow-step/workflow-step.service'
import {
  AsyncActionLoadingDirective,
  AsyncActionReadyDirective,
} from '../../shared/modules/async-action/async-action.directive'
import { RequestService } from '../../shared/services/request.service'
import { AsyncActionComponent } from '../../shared/modules/async-action/async-action.component'
import { tap } from 'rxjs'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [
    CommonModule, JsonPipe, WithStatusPipe, RouterLink, MatExpansionModule, MatSnackBarModule,
    AsyncActionLoadingDirective, AsyncActionReadyDirective, AsyncActionComponent,
  ],
  template: `
      <ng-container *ngIf="workflow$ | withStatus | async as workflowRes">
          <ng-container *ngIf="workflowRes.value as workflow">

              <h1 class="text-2xl mt-8">{{ workflow.workflow_name }}</h1>
              <p class="mt-2">{{ workflow.workflow_description }}</p>

              <h2 class="mt-2">Steps:</h2>
              <ul class="list-disc mt-2">
                  <li class="ml-8" *ngFor="let step of workflow.steps">
                      {{ step.description }}
                  </li>
              </ul>

              <div class="mt-4">
                  <mat-accordion>
                      <mat-expansion-panel>
                          <mat-expansion-panel-header>
                              <mat-panel-title>
                                  See raw workflow configuration
                              </mat-panel-title>
                          </mat-expansion-panel-header>

                          <pre class="mt-2 overflow-auto">{{ workflow | json }}</pre>
                      </mat-expansion-panel>
                  </mat-accordion>
              </div>


              <div class="flex gap-2 flex-wrap mt-4">
                  <button class="btn" routerLink="steps/1" queryParamsHandling="merge">
                      Start workflow
                  </button>

                  <ng-container *ngIf="(workflowRequest$ | async) === undefined">
                      <button *ngIf="workflowID$ | async as workflowID"
                              [appAsyncAction]="createRequest$(workflowID)"
                              class="btn">
                          <ng-template appAsyncActionReady>
                              Create request
                          </ng-template>

                          <ng-template appAsyncActionLoading>
                              Creating request...
                          </ng-template>
                      </button>

                  </ng-container>
              </div>
          </ng-container>

          <ng-container *ngIf="workflowRes.error as error">
              <p>{{ error }}</p>
          </ng-container>

          <ng-container *ngIf="workflowRes.loading">
              <p>Loading workflow...</p>
          </ng-container>
      </ng-container>
  `,
})
export class WorkflowDetailComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly workflowService = inject(WorkflowService)
  private readonly workflowStepService = inject(WorkflowStepService)
  private readonly requestService = inject(RequestService)
  private readonly matSnackBar = inject(MatSnackBar)
  private readonly router = inject(Router)

  workflowID$ = this.route.params.pipe(map(params => params['id']))
  workflow$ = this.workflowID$.pipe(
    switchMap(id => this.workflowService.getWorkflow(id)),
  )

  workflowRequest$ = this.workflowStepService.request$

  createRequest$ = (workflowID: string) => {
    return () => {
      return this.requestService.createWorkflowRequest(workflowID).pipe(
        tap(() => this.matSnackBar.open('Request created', 'Close', {duration: 3000})),
        tap((res) => this.router.navigate([`/requests/${res.requestID}`])),
      )
    }
  }
}
