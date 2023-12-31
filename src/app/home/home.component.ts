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

      <p class="mt-4">
          Check out the <a routerLink="/workflows/QmTDyDyaDuVq5XeLye7AeJFZRvMVE4uQDde8YwS8Cv2wee" class="underline">example</a>
          workflow to get started.
      </p>

      <button class="btn mt-4" routerLink="workflows/new">
          Create new workflow
      </button>

      <p class="mt-4">
          You can also create a request to execute a workflow and follow its progress.
      </p> 
      
      <button class="btn mt-4" routerLink="requests">
          Requests
      </button>
  `,
  styles: [],
})
export class HomeComponent {
}
