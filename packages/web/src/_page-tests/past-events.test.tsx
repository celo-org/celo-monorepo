import PastEventsPage from 'pages/past-events'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('PastEventsPage', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <PastEventsPage />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
