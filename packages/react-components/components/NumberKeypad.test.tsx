import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe(NumberKeypad, () => {
  it('renders correctly without decimal separator', () => {
    const tree = renderer.create(
      <NumberKeypad onDigitPress={jest.fn()} onBackspacePress={jest.fn()} />
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with decimal separator', () => {
    const tree = renderer.create(
      <NumberKeypad
        onDigitPress={jest.fn()}
        onBackspacePress={jest.fn()}
        decimalSeparator={','}
        onDecimalPress={jest.fn()}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
