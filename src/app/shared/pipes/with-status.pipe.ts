import { Pipe, PipeTransform } from '@angular/core'
import { Observable } from 'rxjs'
import { withStatus, WithStatus } from '../utils/observables'

@Pipe({
  name: 'withStatus',
  standalone: true,
})
export class WithStatusPipe implements PipeTransform {
  transform<T>(value: Observable<T>): Observable<WithStatus<T>> {
    return withStatus(value, {autoRecoverDue: 15_000})
  }
}
