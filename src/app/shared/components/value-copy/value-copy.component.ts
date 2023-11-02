import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'
import { BehaviorSubject, EMPTY, from, Observable } from 'rxjs'
import { catchError, delay, tap } from 'rxjs/operators'
import { CommonModule } from '@angular/common'
import { MatTooltipModule } from '@angular/material/tooltip'
import { AsyncActionModule } from '../../modules/async-action/async-action.module'

@Component({
  selector: 'app-value-copy',
  template: `
      <button [appAsyncAction]="click.bind(this)"
              *ngIf="(state$ | async) as state"
              matTooltip="Copy"
              class="inline-flex items-center justify-center grow-0 p-1.5 bg-gray-200 rounded-full">
          <ng-template appAsyncActionReady appAsyncActionLoading>
              <svg *ngIf="state === stateType.READY" class="h-3 w-3" width="14" height="14" viewBox="0 0 14 14"
                   fill="none"
                   xmlns="http://www.w3.org/2000/svg">
                  <path
                          d="M4.33317 3.66667V9C4.33317 9.35362 4.47365 9.69276 4.72369 9.94281C4.97374 10.1929 5.31288 10.3333 5.6665 10.3333H9.6665M4.33317 3.66667V2.33333C4.33317 1.97971 4.47365 1.64057 4.72369 1.39052C4.97374 1.14048 5.31288 1 5.6665 1H8.72384C8.90063 1.00004 9.07018 1.0703 9.19517 1.19533L12.1378 4.138C12.2629 4.263 12.3331 4.43254 12.3332 4.60933V9C12.3332 9.35362 12.1927 9.69276 11.9426 9.94281C11.6926 10.1929 11.3535 10.3333 10.9998 10.3333H9.6665M4.33317 3.66667H2.99984C2.64622 3.66667 2.30708 3.80714 2.05703 4.05719C1.80698 4.30724 1.6665 4.64638 1.6665 5V11.6667C1.6665 12.0203 1.80698 12.3594 2.05703 12.6095C2.30708 12.8595 2.64622 13 2.99984 13H8.33317C8.68679 13 9.02593 12.8595 9.27598 12.6095C9.52603 12.3594 9.6665 12.0203 9.6665 11.6667V10.3333"
                          stroke="#3F3F46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg *ngIf="state === stateType.COPIED" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span *ngIf="stateTexts[state!]" class="ml-2 font-semibold">
                  {{ stateTexts[state!] }}
                </span>
          </ng-template>
      </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatTooltipModule, AsyncActionModule],
})
export class ValueCopyComponent implements OnInit {
  @Input() value = ''
  @Input() delay = 1000
  @Input() textReady = ''
  @Input() textCopied = ''

  stateType = State
  stateTexts!: { [key in State]: string }

  stateSub = new BehaviorSubject<State>(State.READY)
  state$ = this.stateSub.asObservable()

  constructor() {
  }

  ngOnInit() {
    this.stateTexts = {
      [State.READY]: this.textReady,
      [State.COPIED]: this.textCopied,
    }
  }

  click(): Observable<unknown> {
    return from(navigator.clipboard.writeText(this.value)).pipe(
      catchError(() => {
        this.fallbackCopy()
        return EMPTY
      }),
      tap(() => this.stateSub.next(State.COPIED)),
      delay(this.delay),
      tap(() => this.stateSub.next(State.READY)),
      catchError(() => EMPTY),
    )
  }

  private fallbackCopy() {
    const selBox = document.createElement('textarea')
    selBox.style.position = 'fixed'
    selBox.style.left = '0'
    selBox.style.top = '0'
    selBox.style.opacity = '0'
    selBox.value = this.value || ''
    document.body.appendChild(selBox)
    selBox.focus()
    selBox.select()
    document.execCommand('copy')
    document.body.removeChild(selBox)
  }
}

enum State {
  READY = 1,
  COPIED = 2
}
