import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Invite from 'src/account/Invite'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockE164NumberToInvitableRecipient } from 'test/values'

describe('Invite', () => {
  it('renders correctly with recipients', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          recipients: { recipientCache: mockE164NumberToInvitableRecipient },
        })}
      >
        <Invite {...getMockStackScreenProps(Screens.Invite)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no recipients', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Invite {...getMockStackScreenProps(Screens.Invite)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
