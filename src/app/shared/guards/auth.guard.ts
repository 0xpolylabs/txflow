import { CanActivateFn, Router } from '@angular/router'
import { inject } from '@angular/core'
import { catchError, map } from 'rxjs/operators'
import { SignerService } from '../services/signer.service'

export function authGuard(): CanActivateFn {
  return () => {
    const signerService = inject(SignerService)
    const router = inject(Router)

    return signerService.ensureAuth.pipe(
      catchError(() => router.navigate(['/'])),
      map(() => true),
    )
  }
}
