import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import FeeExchangeEducation from 'src/exchange/FeeExchangeEducation'

it('renders correctly', () => {
  const tree = renderer.create(<FeeExchangeEducation />)
  expect(tree).toMatchSnapshot()
})
