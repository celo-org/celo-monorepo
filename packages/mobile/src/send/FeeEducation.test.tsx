import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import FeeEducation from 'src/send/FeeEducation'

it('renders correctly', () => {
  const tree = renderer.create(<FeeEducation />)
  expect(tree).toMatchSnapshot()
})
