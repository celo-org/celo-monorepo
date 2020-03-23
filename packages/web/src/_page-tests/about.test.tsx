import About from 'pages/about'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { Contributor } from 'src/about/Contributor'

const CONTRIBUTORS: Contributor[] = [
  {
    name: 'Jon',
    preview: 'test.jpg',
    company: 'Test Collective Inc',
    purpose: 'To ensure rightness',
    url: 'www.example.com',
    photo: 'test.jpg',
  },
]
describe('About', () => {
  it('renders', () => {
    const tree = renderer.create(<About contributors={CONTRIBUTORS} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
