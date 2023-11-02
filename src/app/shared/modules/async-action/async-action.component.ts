import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  DestroyRef,
  HostBinding,
  HostListener,
  inject,
  Input,
  NgZone,
  signal,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { EMPTY, NEVER, Observable, switchMap, takeUntil, tap, timer } from 'rxjs'
import { AsyncActionLoadingDirective, AsyncActionReadyDirective } from './async-action.directive'
import { finalize } from 'rxjs/operators'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appAsyncAction]',
  standalone: true,
  imports: [CommonModule],
  exportAs: 'appAsyncAction',
  template: `
      <ng-container *ngIf="!showLoading(); else loading">
          <ng-container *ngIf="readyDirective?.templateRef as templateRef; else defaultReady">
              <ng-container *ngTemplateOutlet="templateRef"></ng-container>
          </ng-container>

          <ng-template #defaultReady>{{ text }}</ng-template>
      </ng-container>

      <ng-template #loading>
          <ng-container *ngIf="loadingDirective?.templateRef as templateRef; else defaultLoading">
              <ng-container *ngTemplateOutlet="templateRef"></ng-container>
          </ng-container>
          <ng-template #defaultLoading>{{ textLoading ?? text }}</ng-template>
      </ng-template>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncActionComponent {
  private readonly destroyRef = inject(DestroyRef)
  private readonly zone = inject(NgZone)

  private readonly loadingInProgress = signal(false)
  readonly showLoading = signal(false)

  @Input() text?: string
  @Input() textLoading?: string

  @Input() class = ''
  @Input() disabled = false

  @ContentChild(AsyncActionReadyDirective)
  readonly readyDirective?: AsyncActionReadyDirective
  @ContentChild(AsyncActionLoadingDirective)
  readonly loadingDirective?: AsyncActionLoadingDirective

  @Input({alias: 'appAsyncAction', required: true})
  asyncAction: () => Observable<unknown> = () => EMPTY
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input({alias: 'appAsyncActionLoadingOffset'}) showLoadingOffset = 200

  @HostBinding('class') get hostClass(): string {
    return this.class || ''
  }

  @HostBinding('disabled') get hostDisabled(): boolean {
    return this.disabled || this.loadingInProgress()
  }

  @HostListener('click')
  click(): void {
    if (this.hostDisabled) return

    this.loadingInProgress.set(true)
    timer(this.showLoadingOffset).pipe(
      tap(() => this.showLoading.set(true)),
      switchMap(() => NEVER),
      takeUntil(this.asyncAction().pipe(
        finalize(() => {
          // mystery. don't know why it works, but it works.
          // in some cases, the loading indicator doesn't disappear
          setTimeout(() => {
            this.zone.run(() => {
              this.afterLoadingCleanup()
            })
          }, 0)
        }),
      )),
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe()
  }

  private afterLoadingCleanup() {
    this.loadingInProgress.set(false)
    this.showLoading.set(false)
  }
}
