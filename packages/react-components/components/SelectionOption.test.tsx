import SelectionOption from '@celo/react-components/components/SelectionOption'
import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'

it('renders unselected correctly', () => {
  const tree = renderer.create(
    <SelectionOption key={'Example'} word={'Example'} selected={false} onSelectAnswer={jest.fn()} />
  )
  expect(tree).toMatchSnapshot()
})

it('renders selected correctly', () => {
  const tree = renderer.create(
    <SelectionOption key={'Example'} word={'Example'} selected={true} onSelectAnswer={jest.fn()} />
  )
  expect(tree).toMatchSnapshot()
})
