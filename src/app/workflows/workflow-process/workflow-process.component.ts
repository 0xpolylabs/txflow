import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { WithStatusPipe } from '../../shared/pipes/with-status.pipe'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { WorkflowService } from '../../shared/services/workflow.service'
import { combineLatest, EMPTY, Observable, of } from 'rxjs'
import { Step, Workflow } from '../../shared/interfaces/workflow'
import { map, switchMap } from 'rxjs/operators'

@Component({
  selector: 'app-workflow-process',
  standalone: true,
  imports: [CommonModule, WithStatusPipe, RouterLink],
  template: `
      <div class="max-w-screen-md mx-auto px-4 py-2">
          <ng-container *ngIf="workflow$ | withStatus | async as workflowRes">
              <ng-container *ngIf="workflowRes.value as workflow">
                  <ng-container *ngIf="stepNumber$ | async as stepNumber">
                      <ng-container *ngIf="step$ | async as step">
                          <h1>Step {{ stepNumber }} / {{ workflow.steps.length }}</h1>

                          {{ step | json }}
                      </ng-container>

                      <div class="flex gap-2 mt-2">
                          <button class="btn" routerLink="../{{ stepNumber - 1 }}"
                                  [disabled]="stepNumber <= 1">
                              Previous
                          </button>
                          <button class="btn" routerLink="../{{ stepNumber + 1 }}"
                                  [disabled]="stepNumber >= workflow.steps.length">
                              Next
                          </button>
                      </div>
                  </ng-container>
              </ng-container>

              <ng-container *ngIf="workflowRes.error as error">
                  <p>{{ error }}</p>
              </ng-container>

              <ng-container *ngIf="workflowRes.loading">
                  <p>Loading workflow...</p>
              </ng-container>
          </ng-container>
      </div>
  `,
  styles: [],
})
export class WorkflowProcessComponent {
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  private readonly workflowService = inject(WorkflowService)

  workflow$: Observable<Workflow> = this.route.params.pipe(
    switchMap(params => this.workflowService.getWorkflow(params['id'])),
  )
  stepNumber$: Observable<number> = this.route.params.pipe(map(params => Number(params['step'])))

  step$: Observable<Step> = combineLatest([this.workflow$, this.stepNumber$]).pipe(
    switchMap(([workflow, step]) => {
      try {
        return of(workflow.steps[step - 1])
      } catch (e) {
        this.router.navigate([`../1`], {relativeTo: this.route})
        return EMPTY
      }
    }),
  )
}
