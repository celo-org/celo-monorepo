import BackButton from '@celo/react-components/components/BackButton.v2'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'

describe('BackButton', () => {
  it('renders with minimum props', () => {
    const tree = renderer.create(<BackButton onPress={jest.fn()} />)
    expect(tree).toMatchSnapshot()
  })

  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const { getByTestId } = render(<BackButton onPress={handler} testID={'TEST'} />)
      const button = getByTestId('TEST')

      fireEvent.press(button)
      expect(handler).toBeCalled()
    })
  })
})
