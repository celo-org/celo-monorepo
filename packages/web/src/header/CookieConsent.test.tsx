import { fireEvent, render, wait, waitForDomChange } from '@testing-library/react'
import * as React from 'react'
import { TestProvider } from 'src/_page-tests/test-utils'
import { agree, disagree } from 'src/analytics/analytics'
import CookieConsent from 'src/header/CookieConsent'
import { initSentry } from 'src/utils/sentry'

jest.mock('src/utils/sentry', () => {
  return { initSentry: jest.fn() }
})

jest.mock('src/analytics/analytics', () => {
  return { agree: jest.fn(), disagree: jest.fn(), showVisitorCookieConsent: jest.fn(() => true) }
})

describe('CookieConsent', () => {
  describe('when press agree', () => {
    it('initializes Sentry', async () => {
      const { getByText } = render(
        <TestProvider>
          <CookieConsent />
        </TestProvider>
      )
      await waitForDomChange()
      fireEvent.click(getByText('Agree'))

      expect(agree).toHaveBeenCalled()
      await wait()
      expect(initSentry).toHaveBeenCalled()
    })
  })
  describe('when disagree', () => {
    it('does calls disagree', async () => {
      const { getByText } = render(
        <TestProvider>
          <CookieConsent />
        </TestProvider>
      )
      await waitForDomChange()
      fireEvent.click(getByText('Disagree'))
      expect(disagree).toHaveBeenCalled()
    })
  })
})
