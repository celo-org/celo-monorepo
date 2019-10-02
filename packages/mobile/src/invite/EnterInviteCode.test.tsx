import * as React from 'react'
import { Clipboard } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import EnterInviteCode, {
  EnterInviteCode as EnterInviteCodeClass,
} from 'src/invite/EnterInviteCode'
import {
  PARTIAL_INVITE,
  PARTIAL_INVITE_KEY,
  VALID_INVITE,
  VALID_INVITE_KEY,
} from 'src/invite/utils.test'
import { createMockStore, getMockI18nProps } from 'test/utils'

SendIntentAndroid.openSMSApp = jest.fn()

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('EnterInviteCode Screen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <EnterInviteCode {...getMockI18nProps()} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders with an error', () => {
    const store = createMockStore({ alert: { underlyingError: ErrorMessages.INVALID_INVITATION } })
    const tree = renderer.create(
      <Provider store={store}>
        <EnterInviteCode />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('works with partial invite text in clipboard', async () => {
    const store = createMockStore()
    const redeem = jest.fn()
    Clipboard.getString = jest.fn(() => Promise.resolve(PARTIAL_INVITE))
    const wrapper = render(
      <Provider store={store}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          redeemComplete={false}
          isRedeemingInvite={false}
          account={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    await Clipboard.getString()
    expect(wrapper.queryByTestId('pasteMessageButton')).not.toBeNull()
    fireEvent.press(wrapper.getByTestId('pasteMessageButton'))
    await Clipboard.getString()
    expect(redeem).toHaveBeenCalledWith(PARTIAL_INVITE_KEY)
  })

  it('calls redeem invite with valid invite key in clipboard', async () => {
    const redeem = jest.fn()
    Clipboard.getString = jest.fn(() => Promise.resolve(VALID_INVITE))
    const wrapper = render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          redeemComplete={false}
          isRedeemingInvite={false}
          account={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    await Clipboard.getString()
    fireEvent.press(wrapper.getByTestId('pasteMessageButton'))
    await Clipboard.getString()
    expect(redeem).toHaveBeenCalledWith(VALID_INVITE_KEY)
  })

  it('does not proceed with an invalid invite key in clipboard', async () => {
    const redeem = jest.fn()
    Clipboard.getString = jest.fn(() => Promise.resolve('abc'))
    const wrapper = render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          redeemComplete={false}
          isRedeemingInvite={false}
          account={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.press(wrapper.getByTestId('openMessageButton'))
    await Clipboard.getString()
    expect(wrapper.queryByTestId('pasteMessageButton')).toBeNull()
    expect(redeem).not.toHaveBeenCalledWith(VALID_INVITE_KEY)
  })
})
