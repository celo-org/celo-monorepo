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
import { VALID_INVITE, VALID_INVITE_KEY } from 'src/invite/utils.test'
import { createMockStore, getMockI18nProps } from 'test/utils'

SendIntentAndroid.openSMSApp = jest.fn()

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

  it.skip('checks the current appstate to see if valid code in clipboard', () => {
    const store = createMockStore()
    const wrapper = render(
      <Provider store={store}>
        <EnterInviteCode />
      </Provider>
    )

    fireEvent.press(wrapper.getByTestId('openMessageButton'))
    expect(wrapper.queryByTestId('pasteMessageButton')).not.toBeNull()
    expect(wrapper.queryByTestId('openMessageButton')).toBeNull()
  })

  it.skip('calls redeem invite with valid invite key in clipboard', async () => {
    const redeem = jest.fn()
    Clipboard.getString = jest.fn(() => Promise.resolve(VALID_INVITE))
    const wrapper = render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          error={null}
          name={''}
          redeemComplete={false}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.press(wrapper.getByTestId('openMessageButton'))
    await Clipboard.getString()
    fireEvent.press(wrapper.getByTestId('pasteMessageButton'))
    await Clipboard.getString()
    expect(redeem).toHaveBeenCalledWith(VALID_INVITE_KEY, '')
  })

  it.skip('paste message disabled with invalid invite key in clipboard', async () => {
    const redeem = jest.fn()
    Clipboard.getString = jest.fn(() => Promise.resolve('abc'))
    const wrapper = render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          error={null}
          name={''}
          redeemComplete={false}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.press(wrapper.getByTestId('openMessageButton'))
    await Clipboard.getString()
    fireEvent.press(wrapper.getByTestId('pasteMessageButton'))
    await Clipboard.getString()
    expect(redeem).not.toHaveBeenCalledWith(VALID_INVITE_KEY, '')
  })

  it.skip('shows an error with an invalid invite code', async () => {
    const error = jest.fn()
    Clipboard.getString = jest.fn(() => Promise.resolve('abc'))

    const wrapper = render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={jest.fn()}
          showError={error}
          hideAlert={jest.fn()}
          error={null}
          name={''}
          redeemComplete={false}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.press(wrapper.getByTestId('openMessageButton'))
    fireEvent.press(wrapper.getByTestId('pasteMessageButton'))
    await Clipboard.getString()
    expect(error).toHaveBeenCalledWith(ErrorMessages.INVALID_INVITATION, 5000)
  })
})
