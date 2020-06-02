import scrollIntoView from 'scroll-into-view'
import { HEADER_HEIGHT } from 'src/shared/Styles'

export default function scrollToHash(extraDistance: number) {
  const element = document.getElementById(window.location.hash.replace('#', ''))
  scrollIntoView(element, {
    time: 100,
    align: { top: 0, topOffset: HEADER_HEIGHT + extraDistance },
  })
}
