import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

it('renders correctly', () => {
  const tree = renderer.create(<ItemSeparator />)
  expect(tree).toMatchSnapshot()
})
