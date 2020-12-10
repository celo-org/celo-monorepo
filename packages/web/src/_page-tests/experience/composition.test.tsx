import Color from 'pages/experience/brand/composition'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('Experience/Composition', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Color />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
