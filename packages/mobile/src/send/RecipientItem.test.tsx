import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import RecipientItem from 'src/send/RecipientItem'
import { mockRecipient } from 'test/values'

describe(RecipientItem, () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <RecipientItem recipient={mockRecipient} onSelectRecipient={jest.fn()} />
    )
    expect(tree).toMatchSnapshot()
  })
})
