import SmallButton from '@celo/react-components/components/SmallButton'
import Touchable from '@celo/react-components/components/Touchable'
import { shallow } from 'enzyme'
import * as React from 'react'
import { Text } from 'react-native'

describe('SmallButton', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const button = shallow(<SmallButton solid={true} onPress={handler} text="SmallButton" />)
      button.find(Touchable).simulate('press')
      expect(handler).toBeCalled()
    })
  })
  it('renders with minimum props', () => {
    const button = shallow(<SmallButton solid={true} onPress={jest.fn()} text="SmallButton" />)
    expect(
      button
        .find('Text')
        .children()
        .text()
    ).toEqual('SmallButton')
  })
  describe('when disabled', () => {
    it('passes them to Touchable', () => {
      const onPress = jest.fn()
      const button = shallow(
        <SmallButton solid={true} disabled={true} onPress={onPress} text="SmallButton">
          <Text>child text</Text>
        </SmallButton>
      )
      expect(button.find(Touchable).props()).toEqual(
        expect.objectContaining({ disabled: true, onPress })
      )
    })
  })

  describe('when passed accessibilityLabel', () => {
    it('sets it', () => {
      const button = shallow(
        <SmallButton
          solid={true}
          accessibilityLabel="link"
          onPress={jest.fn()}
          text="SmallButton"
        />
      )

      expect(button.find({ accessibilityLabel: 'link' }).length).toEqual(1)
    })
  })
})
