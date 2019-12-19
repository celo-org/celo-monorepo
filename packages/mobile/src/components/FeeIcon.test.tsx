import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import FeeIcon from 'src/components/FeeIcon'

it('renders correctly', () => {
  const tree = renderer.create(<FeeIcon />)
  expect(tree).toMatchSnapshot()
})
