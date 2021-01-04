import KeyImagery from 'pages/experience/brand/key-imagery'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

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

describe('Experience/KeyImagery', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <KeyImagery graphics={MOCK} illos={MOCK} />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
