import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Network } from '../../utils/networks'

@Component({
  selector: 'app-explorer-link',
  templateUrl: './explorer-link.component.html',
  styles: [`
    :host {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  standalone: true,
})
export class ExplorerLinkComponent {
  @Input({required: true}) network!: Network
  @Input({required: true}) value = ''
  @Input() type: ExplorerLinkType = 'address'

  get link(): string {
    const explorerURL = this.network.explorerURLs?.[0]
    if (!explorerURL || !this.value) return ''

    return `${explorerURL}${this.type}/${this.value}`
  }
}

type ExplorerLinkType = 'tx' | 'address' | 'token'
