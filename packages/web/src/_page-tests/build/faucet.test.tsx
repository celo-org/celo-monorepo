import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Faucet from '../../../pages/build/faucet'

describe('Faucet', () => {
  it('renders', () => {
    const tree = renderer.create(<Faucet />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
