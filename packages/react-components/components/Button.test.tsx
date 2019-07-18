import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import { shallow } from 'enzyme'
import * as React from 'react'
import { Text } from 'react-native'
import * as renderer from 'react-test-renderer'

describe('Button', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const button = shallow(
        <Button standard={true} onPress={handler} text="Button" type={BtnTypes.PRIMARY} />
      )
      button.find(Touchable).simulate('press')
      expect(handler).toBeCalled()
    })

    it('multiple times fires once', () => {
      const handler = jest.fn()
      const button = shallow(
        <Button standard={true} onPress={handler} text="Button" type={BtnTypes.PRIMARY} />
      )
      button.find(Touchable).simulate('press')
      button.find(Touchable).simulate('press')
      button.find(Touchable).simulate('press')
      expect(handler).toBeCalledTimes(1)
    })
  })

  it('renders with minimum props', () => {
    const button = shallow(
      <Button standard={true} onPress={jest.fn()} text="Button" type={BtnTypes.PRIMARY} />
    )
    expect(
      button
        .find('Text')
        .children()
        .text()
    ).toEqual('Button')
  })
  describe('when children passed', () => {
    it('renders with children and text', () => {
      const button = shallow(
        <Button standard={true} onPress={jest.fn()} text="Button" type={BtnTypes.PRIMARY}>
          <Text>child text</Text>
        </Button>
      )
      expect(
        button
          .findWhere((node) => node.type() === Text && node.children().text() === 'child text')
          .children()
          .text()
      ).toEqual('child text')
    })
  })
  describe('when disabled / testID props', () => {
    it('passes them to Touchable', () => {
      const onPress = jest.fn()
      const button = shallow(
        <Button
          disabled={true}
          testID={'jest-test'}
          standard={true}
          onPress={onPress}
          text="Button"
          type={BtnTypes.PRIMARY}
        >
          <Text>child text</Text>
        </Button>
      )
      expect(button.find(Touchable).props()).toEqual(
        expect.objectContaining({ testID: 'jest-test', disabled: true })
      )
    })
  })
  describe('when passed accessibilityLabel', () => {
    it('sets it', () => {
      const button = shallow(
        <Button
          accessibilityLabel="link"
          standard={true}
          onPress={jest.fn()}
          text="Button"
          type={BtnTypes.PRIMARY}
        />
      )

      expect(button.find({ accessibilityLabel: 'link' }).length).toEqual(1)
    })
  })
  describe('when type is SECONDARY', () => {
    it('renders', () => {
      const tree = renderer.create(
        <Button standard={true} onPress={jest.fn()} text="Button" type={BtnTypes.SECONDARY}>
          <Text>child text</Text>
        </Button>
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when type is TERTIARY', () => {
    it('renders', () => {
      const tree = renderer.create(
        <Button standard={true} onPress={jest.fn()} text="Button" type={BtnTypes.TERTIARY}>
          <Text>child text</Text>
        </Button>
      )
      expect(tree).toMatchSnapshot()
    })
  })
})
