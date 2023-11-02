import { Directive, inject, TemplateRef } from '@angular/core'

@Directive({selector: '[appAsyncActionReady]', standalone: true})
export class AsyncActionReadyDirective {
  readonly templateRef = inject(TemplateRef<never>)
}

@Directive({selector: '[appAsyncActionLoading]', standalone: true})
export class AsyncActionLoadingDirective {
  readonly templateRef = inject(TemplateRef<never>)
}
