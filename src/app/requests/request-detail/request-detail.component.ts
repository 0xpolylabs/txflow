import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RequestService } from '../../shared/services/request.service'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { shareReplay } from 'rxjs'
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators'
import { WithStatusPipe } from '../../shared/pipes/with-status.pipe'
import { WorkflowService } from '../../shared/services/workflow.service'
import { ValueCopyComponent } from '../../shared/components/value-copy/value-copy.component'
import { WINDOW } from '../../shared/providers/browser.provider'

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, WithStatusPipe, RouterLink, ValueCopyComponent],
  template: `
      <h1 class="text-2xl mt-8">
          Workflow Request Details
      </h1>

      <ng-container *ngIf="request$ | withStatus | async as requestRes">
          <ng-container *ngIf="requestRes.loading">
              <p class="mt-4">Loading workflow request...</p>
          </ng-container>

          <ng-container *ngIf="requestRes.error as error">
              <p class="mt-4 text-red-500">{{ error }}</p>
          </ng-container>

          <ng-container *ngIf="requestRes.value as request">
              <h2 class="mt-4 text-lg font-semibold">
                  {{ request.name }}
              </h2>
              
              <p class="mt-2">
                  Link for execution
                  <app-value-copy [value]="getLinkForExecution(request.requestID, request.workflowID)"/>
              </p>
              
              <div>
                  Creator address: {{ request.creatorAddress }}
              </div>

              <div *ngIf="workflow$ | withStatus | async as workflowRes"
                   class="mt-2">
                  <ng-container *ngIf="workflowRes.loading">
                      <p>Loading workflow...</p>
                  </ng-container>

                  <ng-container *ngIf="workflowRes.error as error">
                      <p>{{ error }}</p>
                  </ng-container>

                  <ng-container *ngIf="workflowRes.value as workflow">
                      <div>
                          Workflow name: {{ workflow.workflow_name }}
                      </div>
                      <div>
                          Workflow description: {{ workflow.workflow_description }}
                      </div>
                      <div>
                          Number of steps: {{ workflow.steps.length }}
                      </div>
                  </ng-container>
              </div>

              <ng-container *ngIf="requestLogs$ | withStatus | async as requestLogsRes">
                  <h3 class="mt-2">
                      Request Logs
                      <button (click)="requestLogsRes.refresh!()">↻</button>
                  </h3>

                  <ng-container *ngIf="requestLogsRes.loading">
                      <p>Loading request logs...</p>
                  </ng-container>

                  <ng-container *ngIf="requestLogsRes.error as error">
                      <p>{{ error }}</p>
                  </ng-container>

                  <ng-container *ngIf="requestLogsRes.value as requestLogs">
                      <p *ngIf="requestLogs.length === 0" class="mt-2">
                          No logs available yet.
                      </p>

                      <div role="listbox" class="flex flex-col gap-2 mt-2">
                          <div role="listitem" class="px-2 py-1 bg-gray-200 rounded"
                               *ngFor="let log of requestLogs">
                              <span>{{ log.message }}</span>
                              <p class="text-right text-xs italic">{{ log.timestamp | date:'medium' }}</p>
                          </div>
                      </div>
                  </ng-container>
              </ng-container>
          </ng-container>
      </ng-container>
  `,
  styles: [],
})
export class RequestDetailComponent {
  private readonly requestService = inject(RequestService)
  private readonly workflowService = inject(WorkflowService)
  private readonly route = inject(ActivatedRoute)
  private readonly window = inject(WINDOW)

  protected request$ = this.route.params.pipe(
    map(params => params['id']),
    distinctUntilChanged(),
    switchMap(id => this.requestService.getRequest(id)),
    shareReplay(1),
  )

  protected workflow$ = this.request$.pipe(
    switchMap(request => this.workflowService.getWorkflow(request.workflowID)),
    shareReplay(1),
  )

  protected requestLogs$ = this.request$.pipe(
    switchMap(request => this.requestService.getRequestLogs(request.requestID)),
  )

  getLinkForExecution(requestID: string, workflowID: string): string {
    return `${this.window.location.origin}/workflows/${workflowID}?requestID=${requestID}`
  }
}
