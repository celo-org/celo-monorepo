import { fireEvent } from '@testing-library/react'

export function onPress(element: Element) {
  // to get onPress to fire: see https://github.com/necolas/react-native-web/issues/1422
  fireEvent.touchStart(element)
  return fireEvent.touchEnd(element)
}
