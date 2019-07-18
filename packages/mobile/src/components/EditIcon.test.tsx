import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import EditIcon from 'src/components/EditIcon'

it('renders correctly', () => {
  const tree = renderer.create(<EditIcon />)
  expect(tree).toMatchSnapshot()
})
