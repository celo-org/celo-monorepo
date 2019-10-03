import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import ImportContacts from 'src/import/ImportContacts'
import { createMockStore, getMockI18nProps } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('ImportContacts Screen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <ImportContacts {...getMockI18nProps()} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
