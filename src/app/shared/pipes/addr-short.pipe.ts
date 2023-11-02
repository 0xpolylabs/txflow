import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'addrShort',
  standalone: true,
})
export class AddrShortPipe implements PipeTransform {
  transform(value: any, startChars = 6, endChars = 4): any {
    if (!value) {
      return ''
    }

    const address = String(value).toLowerCase()

    if ((startChars + endChars) >= address.length) {
      return address
    }

    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars, address.length)}`
  }
}
