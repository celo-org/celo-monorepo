import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { AlertBanner } from 'src/alert/AlertBanner'

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
            errorType: 'show',
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
            errorType: 'show',
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
            errorType: 'show',
            message: 'This is an error',
            dismissAfter: 0,
          }}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })
})
