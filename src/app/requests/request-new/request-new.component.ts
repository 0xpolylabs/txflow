import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { RequestService } from '../../shared/services/request.service'
import { tap } from 'rxjs'
import { AsyncActionModule } from '../../shared/modules/async-action/async-action.module'

@Component({
  selector: 'app-request-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AsyncActionModule, MatSnackBarModule],
  template: `
      <h1 class="text-2xl mt-8">
          New Request
      </h1>

      <form [formGroup]="form" class="flex flex-col max-w-screen-sm">
          <label for="name" class="mt-2">
              Request name
          </label>
          <input id="name" formControlName="name" class="app-input mt-1"/>

          <label for="workflowID" class="mt-2">
              Workflow ID
          </label>
          <input id="workflowID" formControlName="workflowID" class="app-input mt-1"/>

          <button type="submit" class="mt-4 btn"
                  [appAsyncAction]="create$"
                  [disabled]="!form.valid">
              <ng-template appAsyncActionReady>Create</ng-template>
              <ng-template appAsyncActionLoading>Creating...</ng-template>
          </button>
      </form>
  `,
  styles: [],
})
export class RequestNewComponent {
  private readonly fb = inject(NonNullableFormBuilder)
  private readonly requestService = inject(RequestService)
  private readonly matSnackBar = inject(MatSnackBar)
  private readonly router = inject(Router)

  form = this.fb.group({
    name: ['', [Validators.required]],
    workflowID: ['', [Validators.required]],
  })

  create$ = () => {
    return this.requestService.createWorkflowRequest(
      this.form.value.name!,
      this.form.value.workflowID!,
    ).pipe(
      tap(() => this.matSnackBar.open('Request created', 'Close', {duration: 3000})),
      tap(() => this.router.navigate(['/requests'])),
    )
  }
}
