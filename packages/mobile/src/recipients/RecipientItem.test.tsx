import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import RecipientItem from 'src/recipients/RecipientItem'
import { createMockStore } from 'test/utils'
import { mockRecipient } from 'test/values'

describe(RecipientItem, () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <RecipientItem recipient={mockRecipient} onSelectRecipient={jest.fn()} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
