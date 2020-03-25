jest.mock('cross-fetch', () => {
  return async () => ({
    json: async () => ({
      articles: [
        { imgSource: 'test.jpg', href: '/', title: 'Alliance', text: 'Decentralize Together' },
      ],
    }),
  })
})
import Alliance from 'pages/alliance'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { Category } from 'src/alliance/CategoryEnum'
import { TestProvider } from 'src/_page-tests/test-utils'

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
