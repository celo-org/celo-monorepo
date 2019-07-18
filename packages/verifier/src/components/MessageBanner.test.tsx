import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { MessageBanner } from 'src/components/MessageBanner'
describe('Message Banner', () => {
  const baseProps = {
    clearMessage: jest.fn(),
    dismissMessageAfter: 0,
  }
  describe('when message passed in', () => {
    it('renders message', () => {
      const tree = renderer.create(
        <MessageBanner {...baseProps} message={'This is your shadow speaking'} />
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when message and title passed in', () => {
    it('renders title with message', () => {
      const tree = renderer.create(
        <MessageBanner {...baseProps} message="I am the concensus" title="Declaration" />
      )
      expect(tree).toMatchSnapshot()
    })
  })
})
