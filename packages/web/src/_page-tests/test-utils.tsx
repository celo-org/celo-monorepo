import { render } from '@testing-library/react'
import * as React from 'react'
import NextI18NextInstance from 'src/utils/i18nForTests'

const TranslationProvider = NextI18NextInstance.appWithTranslation(({ children }) => {
  return <>{children}</>
})

export function TestProvider({ children }) {
  return <TranslationProvider>{children}</TranslationProvider>
}

// https://github.com/testing-library/react-testing-library/issues/470
// an issue with muted on video causing a rerender, this seems to be be best solution for now
export const renderIgnoringUnstableFlushDiscreteUpdates = (component: React.ReactElement) => {
  // tslint:disable: no-console
  const originalError = console.error
  const error = jest.fn()
  console.error = error
  const result = render(component)
  expect(error).toHaveBeenCalledTimes(1)
  expect(error).toHaveBeenCalledWith(
    'Warning: unstable_flushDiscreteUpdates: Cannot flush updates when React is already rendering.%s',
    expect.any(String)
  )
  console.error = originalError
  // tslint:enable: no-console
  return result
}
