import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'
import { UserWorkflowService } from '../../shared/services/user-workflow.service'
import { WithStatusPipe } from '../../shared/pipes/with-status.pipe'
import { WorkflowService } from '../../shared/services/workflow.service'
import { distinctUntilChanged } from 'rxjs/operators'
import { WorkflowPipe } from '../../shared/pipes/workflow.pipe'

@Component({
  selector: 'app-workflow-list-my',
  standalone: true,
  imports: [CommonModule, RouterLink, WithStatusPipe, WorkflowPipe],
  template: `
      <h1 class="text-2xl">My workflows</h1>

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

                  <div class="flex flex-col" *ngFor="let workflowID of workflows" role="listbox">
                      <div *ngIf="workflowID | workflow | async as workflow"
                           role="listitem"
                           class="px-2 py-2 bg-gray-200 rounded">
                          <a class="hover:underline" routerLink="../{{workflowID}}">
                              {{ workflow.workflow_name }}
                          </a>
                      </div>
                  </div>
              </ng-container>
          </ng-container>
      </div>

      <button class="btn mt-4" routerLink="../new">
          Create new workflow
      </button>
  `,
  styles: [
  ]
})
export class WorkflowListMyComponent {
  private readonly userWorkflowService = inject(UserWorkflowService)
  private readonly workflowService = inject(WorkflowService)

  workflows$ = this.userWorkflowService.getWorkflows()

  getWorkflow$ = (id: string) => this.workflowService.getWorkflow(id).pipe(
    distinctUntilChanged()
  )
}
