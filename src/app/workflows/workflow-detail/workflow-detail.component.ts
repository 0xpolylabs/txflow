import { Component, inject } from '@angular/core'
import { CommonModule, JsonPipe } from '@angular/common'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { switchMap } from 'rxjs/operators'
import { WorkflowService } from '../../shared/services/workflow.service'
import { WithStatusPipe } from '../../shared/pipes/with-status.pipe'
import { MatExpansionModule } from '@angular/material/expansion'

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [CommonModule, JsonPipe, WithStatusPipe, RouterLink, MatExpansionModule],
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

              <button class="btn mt-4" routerLink="steps/1">
                  Start workflow
              </button>
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

  workflow$ = this.route.params.pipe(
    switchMap(params => this.workflowService.getWorkflow(params['id'])),
  )
}
