import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Wallet from '../../../pages/build/wallet'

describe('Wallet', () => {
  it('renders', () => {
    const tree = renderer.create(<Wallet />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
