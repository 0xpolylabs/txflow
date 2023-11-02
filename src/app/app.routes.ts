import { Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { WorkflowNewComponent } from './workflows/workflow-new/workflow-new.component'
import { WorkflowDetailComponent } from './workflows/workflow-detail/workflow-detail.component'
import { WorkflowStepComponent } from './workflows/workflow-step/workflow-step.component'
import { workflowGuard } from './shared/guards/workflow.guard'
import { workflowStepGuard } from './shared/guards/workflow-step.guard'
import { AppLayoutComponent } from './shared/components/app-layout/app-layout.component'

export const routes: Routes = [
  {
    path: '', component: AppLayoutComponent, children: [
      {path: '', component: HomeComponent, pathMatch: 'full'},
      {path: 'workflows/new', component: WorkflowNewComponent},
      {path: 'workflows/:id', component: WorkflowDetailComponent, canMatch: [workflowGuard]},
      {
        path: 'workflows/:id/steps/:step',
        component: WorkflowStepComponent,
        canActivate: [workflowStepGuard],
      },
    ],
  },

  {path: '**', redirectTo: ''},
]
