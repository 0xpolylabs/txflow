import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router'
import { inject } from '@angular/core'
import { WorkflowService } from '../services/workflow.service'
import { catchError, map } from 'rxjs/operators'

export function workflowGuard(): CanActivateFn {
  return () => {
    const route = inject(ActivatedRouteSnapshot)
    const router = inject(Router)
    const workflowService = inject(WorkflowService)

    const workflowId = route.params['id']
    return workflowService.getWorkflow(workflowId).pipe(
      catchError(() => router.navigate(['/'])),
      map(() => true),
    )
  }
}
