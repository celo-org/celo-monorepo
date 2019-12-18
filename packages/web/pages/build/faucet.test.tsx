import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Faucet from './faucet'

describe('Faucet', () => {
  xit('renders', () => {
    const tree = renderer.create(<Faucet />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
