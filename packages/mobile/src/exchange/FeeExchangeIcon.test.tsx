import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import FeeExchangeIcon from 'src/exchange/FeeExchangeIcon'

it('renders correctly', () => {
  const tree = renderer.create(<FeeExchangeIcon />)
  expect(tree).toMatchSnapshot()
})
