import * as React from 'react'
import NextI18NextInstance from 'src/utils/i18nForTests'

const TranslationProvider = NextI18NextInstance.appWithTranslation(({ children }) => {
  return <>{children}</>
})

export function TestProvider({ children }) {
  return <TranslationProvider>{children}</TranslationProvider>
}
