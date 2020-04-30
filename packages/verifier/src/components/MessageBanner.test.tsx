import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { MessageBanner } from 'src/components/MessageBanner'

describe('Message Banner', () => {
  const baseProps = {
    clearMessage: jest.fn(),
    dismissMessageAfter: 0,
  }
  describe('when message passed in', () => {
    it('renders message', () => {
      const { toJSON } = render(
        <MessageBanner {...baseProps} message={'This is your shadow speaking'} />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })
  describe('when message and title passed in', () => {
    it('renders title with message', () => {
      const { toJSON } = render(
        <MessageBanner {...baseProps} message="I am the concensus" title="Declaration" />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })
})
