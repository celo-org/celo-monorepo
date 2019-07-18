import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION } from 'src/config'
import RedeemInvite, {
  extractInviteCodeFromReferrerData,
  RedeemInvite as RedeemInviteClass,
} from 'src/invite/RedeemInvite'
import { VALID_INVITE, VALID_INVITE_KEY } from 'src/invite/utils.test'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockName } from 'test/values'

describe('RedeemInvite', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <RedeemInvite {...getMockI18nProps()} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders with an error', () => {
    const store = createMockStore({ alert: { underlyingError: ErrorMessages.INVALID_INVITATION } })
    const tree = renderer.create(
      <Provider store={store}>
        <RedeemInvite />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('is disabled with no text', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <RedeemInvite />
      </Provider>
    )

    expect(wrapper.queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
  })

  it('shows an error with an invalid invite code', () => {
    const error = jest.fn()

    const wrapper = render(
      <Provider store={createMockStore()}>
        <RedeemInviteClass
          redeemInvite={jest.fn()}
          showError={error}
          hideAlert={jest.fn()}
          error={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(wrapper.getByTestId('InviteCodeEntry'), 'abc')
    fireEvent.press(wrapper.getByTestId('RedeemInviteButton'))
    expect(error).toHaveBeenCalledWith(ErrorMessages.INVALID_INVITATION, ERROR_BANNER_DURATION)
  })

  it('calls redeem invite with the proper private key', () => {
    const redeem = jest.fn()

    const wrapper = render(
      <Provider store={createMockStore()}>
        <RedeemInviteClass
          redeemInvite={redeem}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          error={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(wrapper.getByTestId('InviteCodeEntry'), VALID_INVITE)
    fireEvent.changeText(wrapper.getByTestId('NameEntry'), mockName)
    fireEvent.press(wrapper.getByTestId('RedeemInviteButton'))
    expect(redeem).toHaveBeenCalledWith(VALID_INVITE_KEY, mockName)
  })
})

it('extracts invite from referrer data correctly', () => {
  expect(extractInviteCodeFromReferrerData('x=a')).toBeNull()
  expect(extractInviteCodeFromReferrerData('')).toBeNull()
  expect(
    extractInviteCodeFromReferrerData(
      'invite-code=0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c'
    )
  ).toBe('0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c')
  expect(
    extractInviteCodeFromReferrerData(
      'invite-code%3D0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8d'
    )
  ).toBe('0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8d')
})
