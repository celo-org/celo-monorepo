import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import ImportContacts from 'src/import/ImportContacts'
import { createMockStore } from 'test/utils'

describe('ImportContacts Screen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <ImportContacts />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
