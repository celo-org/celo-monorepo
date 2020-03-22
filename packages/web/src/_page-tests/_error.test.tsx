import Error from 'pages/_error'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('Error', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Error statusCode={404} />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
