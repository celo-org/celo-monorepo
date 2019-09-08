import SectionHeadNew from '@celo/react-components/components/SectionHeadNew'
import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'

it('renders text', () => {
  const tree = renderer.create(<SectionHeadNew text={'This is a Test'} />)
  expect(tree).toMatchSnapshot()
})

it('renders bubble text', () => {
  const tree = renderer.create(<SectionHeadNew bubbleText={'This is a Bubble'} text={''} />)
  expect(tree).toMatchSnapshot()
})
