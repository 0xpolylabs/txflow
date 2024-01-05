import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { AsyncActionModule } from '../../shared/modules/async-action/async-action.module'
import { switchMap, tap } from 'rxjs/operators'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { WorkflowService } from '../../shared/services/workflow.service'
import { Workflow } from '../../shared/interfaces/workflow'
import WorkflowTI from '../../shared/interfaces/workflow-ti'
import { createCheckers } from 'ts-interface-checker'
import { UserWorkflowService } from '../../shared/services/user-workflow.service'
import { switchMapTap } from '../../shared/utils/observables'

@Component({
  selector: 'app-workflow-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AsyncActionModule, MatSnackBarModule],
  template: `
      <form [formGroup]="form" class="flex flex-col">
          <h1 class="text-2xl mt-8">
              New Workflow
          </h1>

          <label for="config" class="mt-2">Configuration</label>
          <textarea formControlName="config" id="config" rows="15" cols="20"
                    class="app-input mt-1"></textarea>

          <ng-container *ngIf="form.dirty && form.controls.config.errors as errors">
              <p class="text-red-500 mt-2 text-sm" *ngIf="errors?.json">
                  Invalid JSON
              </p>
              <div class="text-red-500 mt-2 text-sm" *ngIf="errors?.workflowConfig as configErrors">
                  <p>Invalid workflow configuration:</p>
                  <ul class="list-disc">
                      <li *ngFor="let error of configErrors"
                          class="ml-4">
                          <b>{{ error.path }}</b> {{ error.message }}
                      </li>
                  </ul>
              </div>
          </ng-container>

          <p class="text-black mt-2">
              Check out the example of workflow configuration
              <a href="/assets/workflow-example.json" target="_blank" class="underline">
                  here</a>.
          </p>

          <button type="submit" class="mt-4 btn" [appAsyncAction]="create$"
                  [disabled]="!form.valid">
              <ng-template appAsyncActionReady>Create</ng-template>
              <ng-template appAsyncActionLoading>Creating...</ng-template>
          </button>
      </form>
  `,
  styles: [],
})
export class WorkflowNewComponent {
  private readonly fb = inject(NonNullableFormBuilder)
  private readonly workflowService = inject(WorkflowService)
  private readonly matSnackBar = inject(MatSnackBar)
  private readonly router = inject(Router)
  private readonly userWorkflowService = inject(UserWorkflowService)

  form = this.fb.group({
    config: ['', [Validators.required, workflowJsonValidator]],
  })

  create$ = () => {
    return this.workflowService.uploadWorkflow(this.form.value.config!).pipe(
      switchMapTap((id) => this.userWorkflowService.addWorkflow(id)),
      tap(() => this.matSnackBar.open('Workflow created', undefined, {
        duration: 2000, verticalPosition: 'bottom',
      })),
      switchMap(id => this.router.navigate(['workflows', id])),
    )
  }
}

function workflowJsonValidator(control: FormControl): ValidationErrors | null {
  let workflow: Workflow

  try {
    workflow = JSON.parse(control.value)
  } catch (e) {
    return {json: true}
  }

  const {Workflow} = createCheckers(WorkflowTI)
  const errors = Workflow.validate(workflow)
  if (errors?.length) {
    return {workflowConfig: errors}
  }

  return null
}
