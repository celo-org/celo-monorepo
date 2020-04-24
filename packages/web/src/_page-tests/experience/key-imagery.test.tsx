import * as React from 'react'
import * as renderer from 'react-test-renderer'

const MOCK = [
  {
    name: 'Graphic',
    description: 'visual',
    uri: 'example.jpg',
    preview: 'preview.png',
    tags: ['spec', 'test'],
    id: '1',
  },
]

import KeyImagery from 'src/../pages/experience/brand/key-imagery'

describe('Experience/KeyImagery', () => {
  it('renders', () => {
    const tree = renderer.create(<KeyImagery graphics={MOCK} illos={MOCK} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
