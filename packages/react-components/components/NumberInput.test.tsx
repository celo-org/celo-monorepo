import NumberInput from '@celo/react-components/components/NumberInput'
import { shallow } from 'enzyme'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('NumberInput', () => {
  it('renders correctly with minimum props', () => {
    const tree = renderer.create(<NumberInput onSubmit={jest.fn()} onChange={jest.fn()} />)
    expect(tree).toMatchSnapshot()
  })
  it('delegates', () => {
    const numberInput = shallow(
      <NumberInput
        onSubmit={jest.fn()}
        onChange={jest.fn()}
        testID="Decentralize!"
        value="1"
        isSensitiveInput={true}
      />
    )
    expect(numberInput.find({ testID: 'Decentralize!' }).prop('value')).toEqual('1')
    expect(numberInput.find({ testID: 'Decentralize!' }).prop('secureTextEntry')).toEqual(true)
  })
})
