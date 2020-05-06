import * as React from 'react'
import * as renderer from 'react-test-renderer'
import ExchangeIcons from '../../../pages/experience/brand/exchange-icons'

describe('Experience/ExchangeIcons', () => {
  it('renders', () => {
    const tree = renderer.create(<ExchangeIcons />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
