import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import * as React from 'react'
import { Text } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'

describe('Button', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const { getByTestId } = render(
        <Button onPress={handler} text="Button" type={BtnTypes.PRIMARY} testID={'TEST'} />
      )
      const button = getByTestId('TEST')

      fireEvent.press(button)
      expect(handler).toBeCalled()
    })

    it('multiple times fires once', () => {
      const handler = jest.fn()
      const { getByTestId } = render(
        <Button onPress={handler} text="Button" type={BtnTypes.PRIMARY} testID={'TEST'} />
      )
      const button = getByTestId('TEST')
      fireEvent.press(button)
      expect(handler).toBeCalledTimes(1)
    })
  })

  it('renders with minimum props', () => {
    const button = render(<Button onPress={jest.fn()} text="Button" type={BtnTypes.PRIMARY} />)
    expect(button.getByText('Button')).toBeTruthy()
  })
  describe('when children passed', () => {
    it('renders with children and text', () => {
      const { queryByTestId, queryByText } = render(
        <Button onPress={jest.fn()} text="Button" type={BtnTypes.PRIMARY}>
          <Text testID="Child">child text</Text>
        </Button>
      )
      expect(queryByTestId('Child')?.props.children).toEqual('child text')
      expect(queryByText('Button')).toBeTruthy()
    })
  })
  describe('when passed accessibilityLabel', () => {
    it('sets it', () => {
      const { getByA11yLabel } = render(
        <Button
          accessibilityLabel="link"
          onPress={jest.fn()}
          text="Button"
          type={BtnTypes.PRIMARY}
        />
      )
      expect(getByA11yLabel('link').children).toContain('Button')
    })
  })
  describe('when type is SECONDARY', () => {
    it('renders', () => {
      const tree = renderer.create(
        <Button onPress={jest.fn()} text="Button" type={BtnTypes.SECONDARY}>
          <Text>child text</Text>
        </Button>
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when type is TERTIARY', () => {
    it('renders', () => {
      const tree = renderer.create(
        <Button onPress={jest.fn()} text="Button" type={BtnTypes.TERTIARY}>
          <Text>child text</Text>
        </Button>
      )
      expect(tree).toMatchSnapshot()
    })
  })
})
