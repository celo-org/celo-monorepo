import TopAlert from '@celo/react-components/components/TopAlert'
import * as React from 'react'
import { Text } from 'react-native'
import * as renderer from 'react-test-renderer'

it('renders correctly', () => {
  const tree = renderer.create(
    <TopAlert height={36} backgroundColor={'red'} visible={true}>
      <Text>Hi</Text>
    </TopAlert>
  )
  expect(tree).toMatchSnapshot()
})
