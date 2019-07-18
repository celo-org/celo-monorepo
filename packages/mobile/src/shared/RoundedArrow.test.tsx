import * as React from 'react'
import * as renderer from 'react-test-renderer'
import RoundedArrow from 'src/shared/RoundedArrow'

it('renders correctly without props', () => {
  const tree = renderer.create(<RoundedArrow />)
  expect(tree).toMatchSnapshot()
})

it('renders accepts a size', () => {
  const tree = renderer.create(<RoundedArrow size={40} />)
  expect(tree).toMatchSnapshot()
})

it('renders accepts a color', () => {
  const tree = renderer.create(<RoundedArrow color={'red'} />)
  expect(tree).toMatchSnapshot()
})
