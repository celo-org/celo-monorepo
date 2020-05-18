import Button, { BtnTypes } from '@celo/react-components/components/Button'
import * as React from 'react'
import { Text } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'

const TEST_TEXT = 'TEST_TEXT'

describe('Button', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const { getByName } = render(
        <Button standard={true} onPress={handler} text="Button" type={BtnTypes.PRIMARY} />
      )
      fireEvent.press(getByName('Button'))
      expect(handler).toBeCalled()
    })

    it('multiple times fires once', () => {
      const handler = jest.fn()
      const { getByName } = render(
        <Button
          standard={true}
          onPress={handler}
          text="Button"
          type={BtnTypes.PRIMARY}
          testID={'ButtonTestId'}
        />
      )
      const button = getByName('TouchableDefault')
      fireEvent.press(button)
      fireEvent.press(button)
      fireEvent.press(button)
      expect(handler).toBeCalledTimes(1)
    })
  })

  it('renders with minimum props', () => {
    const tree = renderer.create(
      <Button standard={true} onPress={jest.fn()} text={TEST_TEXT} type={BtnTypes.PRIMARY} />
    )
    expect(tree).toMatchSnapshot()
  })

  describe('when children passed', () => {
    it('renders with children and text', () => {
      const { getByText } = render(
        <Button standard={true} onPress={jest.fn()} text="Button" type={BtnTypes.PRIMARY}>
          <Text>child text</Text>
        </Button>
      )
      expect(getByText('child text')).toBeTruthy()
    })
  })
  describe('when disabled / testID props', () => {
    it('passes them to Touchable', () => {
      const onPress = jest.fn()
      const { getByName } = render(
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
      expect(getByName('TouchableDefault').props).toMatchObject({
        testID: 'jest-test',
        disabled: true,
      })
    })
  })
  describe('when passed accessibilityLabel', () => {
    it('sets it', () => {
      const { getByA11yLabel } = render(
        <Button
          accessibilityLabel="link"
          standard={true}
          onPress={jest.fn()}
          text="Button"
          type={BtnTypes.PRIMARY}
        />
      )

      expect(getByA11yLabel('link')).toBeTruthy()
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
