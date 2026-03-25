import { stackSticky } from './index'

document.addEventListener('DOMContentLoaded', () => {
  stackSticky()
  stackSticky({ type: 'bottom', selector: '.sticky-bottom:visible' })
  stackSticky({ type: 'left', selector: '.sticky-left:visible' })
  stackSticky({ type: 'right', selector: '.sticky-right:visible' })
})
