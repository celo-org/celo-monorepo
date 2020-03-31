import About from 'pages/about'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
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
    const tree = renderer
      .create(
        <TestProvider>
          <About contributors={CONTRIBUTORS} />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
