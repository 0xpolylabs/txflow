import { NgModule } from '@angular/core'
import { AsyncActionLoadingDirective, AsyncActionReadyDirective } from './async-action.directive'
import { AsyncActionComponent } from './async-action.component'

const components = [AsyncActionComponent]
const directives = [AsyncActionReadyDirective, AsyncActionLoadingDirective]

@NgModule({
  imports: [...components, ...directives],
  exports: [...components, ...directives],
})
export class AsyncActionModule {
}
