import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterLink } from '@angular/router'
import { UserWorkflowService } from '../../shared/services/user-workflow.service'
import { WithStatusPipe } from '../../shared/pipes/with-status.pipe'
import { WorkflowPipe } from '../../shared/pipes/workflow.pipe'
import { ValueCopyComponent } from '../../shared/components/value-copy/value-copy.component'
import { AsyncActionModule } from '../../shared/modules/async-action/async-action.module'
import { RequestService } from '../../shared/services/request.service'
import { tap } from 'rxjs'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'

@Component({
  selector: 'app-workflow-list-my',
  standalone: true,
  imports: [
    CommonModule, RouterLink, WithStatusPipe, WorkflowPipe,
    ValueCopyComponent, AsyncActionModule, MatSnackBarModule,
  ],
  template: `
      <h1 class="text-2xl mt-8">
          My workflows
      </h1>

      <div class="mt-4" *ngIf="workflows$ | withStatus | async as userWorkflowsRes">
          <ng-container *ngIf="userWorkflowsRes.loading">
              Loading workflows...
          </ng-container>

          <ng-container *ngIf="userWorkflowsRes.error">
              Failed to load user workflows
          </ng-container>

          <ng-container *ngIf="userWorkflowsRes.value as workflows">
              <p *ngIf="workflows.length === 0">
                  You have no workflows yet.
              </p>

              <ng-container *ngIf="workflows.length > 0">
                  <p class="" *ngIf="workflows.length === 0">
                      You have no workflows yet.
                  </p>

                  <div class="flex flex-col gap-2" role="listbox">
                      <ng-container *ngFor="let workflowID of workflows">
                          <div *ngIf="workflowID | workflow | async as workflow"
                               role="listitem"
                               class="px-2 py-2 flex justify-between bg-gray-200 rounded">
                              <div>
                                  <a class="hover:underline" routerLink="../{{workflowID}}">
                                      {{ workflow.workflow_name }}</a>
                                  <app-value-copy [value]="workflowID"/>
                              </div>

                              <div>
                                  <button [appAsyncAction]="createRequest$(workflowID)"
                                          class="text-sm">
                                      <ng-template appAsyncActionReady>
                                          Create request
                                      </ng-template>

                                      <ng-template appAsyncActionLoading>
                                          Creating request...
                                      </ng-template>
                                  </button>
                              </div>
                          </div>
                      </ng-container>
                  </div>
              </ng-container>
          </ng-container>
      </div>

      <div class="mt-4 flex gap-2 flex-wrap">
          <button class="btn" routerLink="../new">
              Create new workflow
          </button>

          <button class="btn" routerLink="/requests/new">
              Create new request
          </button>
      </div>
  `,
  styles: [],
})
export class WorkflowListMyComponent {
  private readonly userWorkflowService = inject(UserWorkflowService)
  private readonly requestService = inject(RequestService)
  private readonly matSnackBar = inject(MatSnackBar)
  private readonly router = inject(Router)

  workflows$ = this.userWorkflowService.getWorkflows()

  createRequest$ = (workflowID: string) => {
    return () => this.requestService.createWorkflowRequest(workflowID).pipe(
      tap(() => this.matSnackBar.open('Request created', 'Close', {duration: 3000})),
      tap((res) => this.router.navigate([`/requests/${res.requestID}`])),
    )
  }
}
