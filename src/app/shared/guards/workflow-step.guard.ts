import { ActivatedRouteSnapshot, createUrlTreeFromSnapshot, RouterStateSnapshot } from '@angular/router'
import { inject } from '@angular/core'
import { WorkflowService } from '../services/workflow.service'
import { map } from 'rxjs/operators'

export function workflowStepGuard(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
  const workflowService = inject(WorkflowService)

  const workflowId = route.params['id']
  return workflowService.getWorkflow(workflowId).pipe(
    map(workflow => {
      const stepNumber = Number(route.params['step'])

      if (stepNumber < 1 || stepNumber > workflow.steps.length) {
        return createUrlTreeFromSnapshot(route, ['../1'])
      }

      return true
    }),
  )
}
