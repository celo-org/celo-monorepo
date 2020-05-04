import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import * as React from 'react'
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
      const { getByTestId, debug } = render(
        <Button onPress={handler} text="Button" type={BtnTypes.PRIMARY} testID={'TEST'} />
      )
      const button = getByTestId('TEST')
      fireEvent.press(button)
      fireEvent.press(button)
      fireEvent.press(button)
      debug()
      expect(handler).toBeCalledTimes(1)
    })
    describe('when disabled', () => {
      it('does not fire onPress', () => {
        const handler = jest.fn()
        const { getByTestId, debug } = render(
          <Button
            disabled={true}
            onPress={handler}
            text="Button"
            type={BtnTypes.PRIMARY}
            testID={'TEST'}
          />
        )
        const button = getByTestId('TEST')
        debug()

        fireEvent.press(button)
        expect(handler).not.toBeCalled()
      })
    })
  })

  it('renders with minimum props', () => {
    const button = render(<Button onPress={jest.fn()} text="Button" />)
    expect(button.getByText('Button')).toBeTruthy()
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
        <Button onPress={jest.fn()} text="Button" type={BtnTypes.SECONDARY} />
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when type is TERTIARY', () => {
    it('renders', () => {
      const tree = renderer.create(
        <Button onPress={jest.fn()} text="Button" type={BtnTypes.TERTIARY} />
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when type not given', () => {
    it('defaults to primary', () => {
      const tree = renderer.create(<Button onPress={jest.fn()} text={'Button'} />)
      expect(tree).toMatchSnapshot()
    })
  })
})
