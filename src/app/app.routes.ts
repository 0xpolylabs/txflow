import { Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { WorkflowNewComponent } from './workflows/workflow-new/workflow-new.component'
import { WorkflowDetailComponent } from './workflows/workflow-detail/workflow-detail.component'
import { WorkflowStepComponent } from './workflows/workflow-step/workflow-step.component'
import { workflowGuard } from './shared/guards/workflow.guard'
import { workflowStepGuard } from './shared/guards/workflow-step.guard'
import { AppLayoutComponent } from './shared/components/app-layout/app-layout.component'
import { RequestNewComponent } from './requests/request-new/request-new.component'
import { RequestDetailComponent } from './requests/request-detail/request-detail.component'
import { RequestListComponent } from './requests/request-list/request-list.component'
import { authGuard } from './shared/guards/auth.guard'
import { WorkflowListMyComponent } from './workflows/workflow-list-my/workflow-list-my.component'

export const routes: Routes = [
  {
    path: '', component: AppLayoutComponent, children: [
      {path: '', component: HomeComponent, pathMatch: 'full'},
      {path: 'workflows/new', component: WorkflowNewComponent},
      {path: 'workflows/my', component: WorkflowListMyComponent, canMatch: [authGuard()]},
      {path: 'workflows/:id', component: WorkflowDetailComponent, canMatch: [workflowGuard]},
      {
        path: 'workflows/:id/steps/:step',
        component: WorkflowStepComponent,
        canActivate: [workflowStepGuard],
      },
      {
        path: 'requests', canMatch: [authGuard()], children: [
          {path: '', component: RequestListComponent},
          {path: 'new', component: RequestNewComponent},
          {path: ':id', component: RequestDetailComponent},
        ],
      },
    ],
  },

  {path: '**', redirectTo: ''},
]
