import SmallButton from '@celo/react-components/components/SmallButton'
import Touchable from '@celo/react-components/components/Touchable'
import * as React from 'react'
import { Text } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'

describe('SmallButton', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const { getByType } = render(
        <SmallButton solid={true} onPress={handler} text="SmallButton" />
      )
      fireEvent.press(getByType(Touchable))
      expect(handler).toBeCalled()
    })
  })
  it('renders with minimum props', () => {
    const { getByText } = render(
      <SmallButton solid={true} onPress={jest.fn()} text="SmallButton" />
    )
    expect(getByText('SmallButton')).toBeTruthy()
  })
  describe('when disabled', () => {
    it('passes them to Touchable', () => {
      const onPress = jest.fn()
      const { getByType } = render(
        <SmallButton solid={true} disabled={true} onPress={onPress} text="SmallButton">
          <Text>child text</Text>
        </SmallButton>
      )
      expect(getByType(Touchable).props).toMatchObject({ disabled: true, onPress })
    })
  })

  describe('when passed accessibilityLabel', () => {
    it('sets it', () => {
      const { getByA11yLabel } = render(
        <SmallButton
          solid={true}
          accessibilityLabel="link"
          onPress={jest.fn()}
          text="SmallButton"
        />
      )

      expect(getByA11yLabel('link')).toBeTruthy()
    })
  })
})
