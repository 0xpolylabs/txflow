import { inject, Pipe, PipeTransform } from '@angular/core'
import { WorkflowService } from '../services/workflow.service'
import { Observable } from 'rxjs'
import { Workflow } from '../interfaces/workflow'

@Pipe({
  name: 'workflow',
  standalone: true,
})
export class WorkflowPipe implements PipeTransform {
  private readonly workflowService = inject(WorkflowService)

  transform<T>(workflowID: string): Observable<Workflow> {
    return this.workflowService.getWorkflow(workflowID)
  }
}
