import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Avatar from 'src/components/Avatar'
import { RecipientKind } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'

const mockName = 'mockName'
const mockNumber = '+14155556666'
const mockAccount = '0x0000000000000000000000000000000000007E57'

const store = createMockStore({
  account: {
    defaultCountryCode: '+1',
  },
})

describe(Avatar, () => {
  it('renders correctly with contact but without number', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <Avatar
          iconSize={40}
          recipient={{
            kind: RecipientKind.Contact,
            contactId: 'none',
            displayName: mockName,
          }}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with number but without contact', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <Avatar iconSize={40} e164Number={mockNumber} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with address but without contact nor number', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <Avatar iconSize={40} address={mockAccount} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
