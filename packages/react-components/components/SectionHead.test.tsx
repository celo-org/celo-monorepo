import SectionHead from '@celo/react-components/components/SectionHead'
import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'

it('renders text', () => {
  const tree = renderer.create(<SectionHead text={'This is a Test'} />)
  expect(tree).toMatchSnapshot()
})

it('renders bubble text', () => {
  const tree = renderer.create(<SectionHead bubbleText={'This is a Bubble'} text={''} />)
  expect(tree).toMatchSnapshot()
})
