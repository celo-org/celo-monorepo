import CodeOfConduct from 'pages/code-of-conduct'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('CodeOfConduct', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <CodeOfConduct />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
