import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
      <p>
          TxFlow is a tool for creating and executing multi-step, multi-chain Ethereum
          transactions. Create reusable workflows and execute them in a simple and predictable way.
      </p>

      <div class="mt-8 grid md:grid-cols-2 gap-4">
          <div class="col-span-1 flex flex-col gap-2 p-8 border shadow rounded">
              <p class="text-2xl">
                  Learn from the example workflow to get started.
              </p>

              <button class="btn mt-4 self-end" routerLink="workflows/QmTDyDyaDuVq5XeLye7AeJFZRvMVE4uQDde8YwS8Cv2wee">
                  See example
              </button>
          </div>

          <div class="col-span-1 flex flex-col gap-2 p-8 border shadow rounded">
              <p class="text-2xl">
                  Create your own workflows.
              </p>

              <button class="btn mt-4 self-end" routerLink="workflows/my">
                  My workflows
              </button>
          </div>

          <div class="col-span-1 flex flex-col gap-2 p-8 border shadow rounded">
              <p class="text-2xl">
                  Create a request to execute a workflow and follow its progress.
              </p>

              <button class="btn mt-4 self-end" routerLink="requests">
                  Requests
              </button>
          </div>
      </div>
  `,
  styles: [],
})
export class HomeComponent {
}
