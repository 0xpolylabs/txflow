import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core'
import { provideRouter } from '@angular/router'
import { routes } from './app.routes'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideHttpClient } from '@angular/common/http'
import { combineLatest } from 'rxjs'
import { provideBrowserAPI } from './shared/providers/browser.provider'
import { InitializerService } from './shared/services/initializer.service'
import { IPFSApiService } from './shared/services/ipfs/ipfs.service.types'
import { IpfsPinataApiService } from './shared/services/ipfs/ipfs-pinata-api.service'
import { MatDialogModule } from '@angular/material/dialog'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    provideBrowserAPI(),
    importProvidersFrom(MatDialogModule),
    {provide: IPFSApiService, useClass: IpfsPinataApiService},
    {
      provide: APP_INITIALIZER,
      useFactory: (s: InitializerService) =>
        () => combineLatest([s.initSigner()]),
      multi: true,
      deps: [InitializerService],
    },
  ],
}
