import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import SwitchButton from 'src/components/HomeScreen/SwitchButton'

it('renders correctly', () => {
  const tree = renderer.create(<SwitchButton onToggle={jest.fn()} switchStatus={false} />)
  expect(tree).toMatchSnapshot()
})
