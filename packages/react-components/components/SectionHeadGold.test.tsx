import SectionHead from '@celo/react-components/components/SectionHeadGold'
import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'

it('renders text', () => {
  const tree = renderer.create(<SectionHead text={'This is a Test'} />)
  expect(tree).toMatchSnapshot()
})
