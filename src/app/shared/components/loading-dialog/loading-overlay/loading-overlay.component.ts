import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class LoadingOverlayComponent {
  constructor() {
  }
}
