import BaseNotification from '@celo/react-components/components/BaseNotification'
import * as React from 'react'
import { Text } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'

const props = (onPress = jest.fn()) => ({
  text: 'Gold is where you can choose to store Celo dollars you have',
  image: '',
  title: 'Test',
  ctas: [{ text: 'it goes boom', onPress }],
})

describe(BaseNotification, () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <BaseNotification {...props()}>
        <Text>Test</Text>
      </BaseNotification>
    )
    expect(tree).toMatchSnapshot()
  })
  describe('when ctas are pressed', () => {
    it('calls the on press function', () => {
      const clickHandler = jest.fn()

      const { getByName } = render(
        <BaseNotification {...props(clickHandler)}>
          <Text>Test</Text>
        </BaseNotification>
      )

      fireEvent.press(getByName('TextButton'))
      expect(clickHandler).toHaveBeenCalled()
    })
  })
})
