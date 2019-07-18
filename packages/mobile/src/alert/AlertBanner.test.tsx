import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { AlertBanner } from 'src/alert/AlertBanner'

describe('AlertBanner', () => {
  const baseProps = {
    hideAlert: jest.fn(),
  }

  describe('when message passed in', () => {
    it('renders message', () => {
      const tree = renderer.create(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'message',
            message: 'This is your shadow speaking',
            dismissAfter: 0,
          }}
        />
      )
      expect(tree).toMatchSnapshot()
    })
  })

  describe('when message and title passed in', () => {
    it('renders title with message', () => {
      const tree = renderer.create(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'message',
            title: 'Declaration',
            message: 'This is your shadow speaking',
            dismissAfter: 0,
          }}
        />
      )
      expect(tree).toMatchSnapshot()
    })
  })

  describe('when error message passed in', () => {
    it('renders error message', () => {
      const tree = renderer.create(
        <AlertBanner
          {...baseProps}
          alert={{
            type: 'error',
            message: 'This is an error',
            dismissAfter: 0,
          }}
        />
      )
      expect(tree).toMatchSnapshot()
    })
  })
})
