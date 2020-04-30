import PastEventsPage from 'pages/past-events'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

jest.mock('cross-fetch', () => {
  return async () => ({
    json: async () => ({
      articles: [],
    }),
  })
})

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
