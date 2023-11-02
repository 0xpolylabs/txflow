import { BehaviorSubject, concat, Observable, of, Subscription, tap, timer } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'

export function withStatus<T>(
  source: Observable<T>, opts?: Partial<Options>,
): Observable<WithStatus<T>> {
  const refreshSubject = new BehaviorSubject<void>(undefined)
  const stream: Observable<WithStatus<T>>[] = []

  if (!opts?.hideLoading) {
    stream.push(of({loading: true} as WithStatus<T>))
  }

  stream.push(
    source.pipe(
      map(value => ({value})),
      catchError(error => of({error})),
    ),
  )

  return new Observable(subscriber => {
    let autoRecoverSubscription: Subscription
    const subscription = refreshSubject.asObservable().pipe(
      switchMap(() => concat(...stream)),
    ).subscribe({
      next: valueWithStatus => {
        if (opts?.autoRecoverDue) {
          if (!autoRecoverSubscription?.closed) autoRecoverSubscription?.unsubscribe()

          if (valueWithStatus.error) {
            autoRecoverSubscription = timer(opts.autoRecoverDue).pipe(
              tap(() => refreshSubject.next()),
            ).subscribe()
          }
        }

        subscriber.next({
          ...valueWithStatus,
          refresh: () => refreshSubject.next(),
        })
      },
      error: err => subscriber.error(err),
      complete: () => subscriber.complete(),
    })

    return () => {
      refreshSubject.complete()
      subscription.unsubscribe()
      if (!autoRecoverSubscription?.closed) autoRecoverSubscription?.unsubscribe()
    }
  })
}

export interface WithStatus<T> {
  loading?: boolean;
  value?: T;
  error?: unknown;
  refresh?: () => void;
}

interface Options {
  hideLoading: boolean
  autoRecoverDue: number // millis
}
