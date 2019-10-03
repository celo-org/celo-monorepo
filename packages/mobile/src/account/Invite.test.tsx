import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Invite from 'src/account/Invite'
import { createMockStore } from 'test/utils'
import { mockE164NumberToInvitableRecipient, mockNavigation } from 'test/values'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('Invite', () => {
  it('renders correctly with recipients', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          recipients: { recipientCache: mockE164NumberToInvitableRecipient },
        })}
      >
        {/*
          // @ts-ignore */}
        <Invite navigation={mockNavigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no recipients', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        {/*
          // @ts-ignore */}
        <Invite navigation={mockNavigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
