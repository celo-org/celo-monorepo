import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import RecipientItem from 'src/recipients/RecipientItem'
import { mockRecipient } from 'test/values'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe(RecipientItem, () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <RecipientItem recipient={mockRecipient} onSelectRecipient={jest.fn()} />
    )
    expect(tree).toMatchSnapshot()
  })
})
