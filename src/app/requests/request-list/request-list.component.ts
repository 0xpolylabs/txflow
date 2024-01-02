import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { RequestService } from '../../shared/services/request.service'
import { WithStatusPipe } from '../../shared/pipes/with-status.pipe'
import { ValueCopyComponent } from '../../shared/components/value-copy/value-copy.component'

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterModule, WithStatusPipe, ValueCopyComponent],
  template: `
      <h1 class="text-2xl mt-8">
          Workflow Requests
      </h1>

      <ng-container *ngIf="requests$ | withStatus | async as requestsRes">
          <ng-container *ngIf="requestsRes.loading">
              <p class="mt-4">Loading workflow requests...</p>
          </ng-container>

          <ng-container *ngIf="requestsRes.error as error">
              <p class="mt-4 text-red-500">{{ error }}</p>
          </ng-container>

          <ng-container *ngIf="requestsRes.value as requests">
              <div class="mt-4" *ngIf="requests.length === 0">
                  <p>No workflow requests available.</p>
              </div>

              <div class="mt-4 flex flex-col gap-2" *ngIf="requests.length > 0" role="listbox">
                  <div role="listitem" *ngFor="let request of requests"
                       class="px-2 py-2 bg-gray-200 rounded">
                      <div>
                          <a class="hover:underline" routerLink="{{ request.requestID }}">
                              {{ request.name }}</a>
                      </div>
                  </div>
              </div>
          </ng-container>
          <button class="btn mt-4" routerLink="new">
              Create new request
          </button>
      </ng-container>
  `,
})
export class RequestListComponent {
  private readonly requestService = inject(RequestService)

  readonly requests$ = this.requestService.getRequestsForCreator()
}
