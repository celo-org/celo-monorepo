import { fireEvent } from '@testing-library/react'
import * as React from 'react'
import NextI18NextInstance from 'src/utils/i18nForTests'

export function onPress(element: Element) {
  // to get onPress to fire: see https://github.com/necolas/react-native-web/issues/1422
  fireEvent.touchStart(element)
  return fireEvent.touchEnd(element)
}

const TranslationProvider = NextI18NextInstance.appWithTranslation(({ children }) => {
  return <>{children}</>
})

export function TestProvider({ children }) {
  return <TranslationProvider>{children}</TranslationProvider>
}
