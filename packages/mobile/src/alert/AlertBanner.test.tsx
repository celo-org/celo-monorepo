import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { AlertBanner } from 'src/alert/AlertBanner'
import { ErrorDisplayType } from 'src/alert/reducer'

describe('AlertBanner', () => {
  const baseProps = {
    hideAlert: jest.fn(),
  }

  describe('when message passed in', () => {
    it('renders message', () => {
      const { toJSON } = render(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'message',
            displayMethod: ErrorDisplayType.BANNER,
            message: 'This is your shadow speaking',
            dismissAfter: 0,
          }}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  describe('when message and title passed in', () => {
    it('renders title with message', () => {
      const { toJSON } = render(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'message',
            displayMethod: ErrorDisplayType.BANNER,
            title: 'Declaration',
            message: 'This is your shadow speaking',
            dismissAfter: 0,
          }}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  describe('when error message passed in', () => {
    it('renders error message', () => {
      const { toJSON } = render(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'error',
            displayMethod: ErrorDisplayType.BANNER,
            message: 'This is an error',
            dismissAfter: 0,
          }}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })
})
