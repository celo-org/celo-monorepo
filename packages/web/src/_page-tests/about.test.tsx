import About from 'pages/about'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { Contributor } from 'src/about/Contributor'
import { TestProvider } from 'src/_page-tests/test-utils'

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

  it('should fail sometimes', async () => {
    const x = Math.floor(Math.random() * Math.floor(4))
    expect(x).toBeGreaterThan(1)
    const y = Math.floor(Math.random() * Math.floor(5))
    expect(y).toBeGreaterThan(2)
  })
})
