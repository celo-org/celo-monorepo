import Alliance from 'pages/alliance'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import { Category } from 'src/alliance/CategoryEnum'

jest.mock('src/alliance/gatherAllies', () => {
  return (callback) => {
    callback(
      Object.keys(Category).map((key: Category) => {
        return {
          name: key,
          records: [],
        }
      })
    )
  }
})

describe('Alliance', () => {
  beforeEach(() => {
    global.fetch.mockResponseOnce(JSON.stringify({ articles: [] }))
  })

  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Alliance />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
