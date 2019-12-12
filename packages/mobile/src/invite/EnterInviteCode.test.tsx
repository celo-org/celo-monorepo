import * as React from 'react'
import { Clipboard } from 'react-native'
import RNInstallReferrer from 'react-native-install-referrer'
import SendIntentAndroid from 'react-native-send-intent'
import { fireEvent, flushMicrotasksQueue, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import EnterInviteCode, {
  EnterInviteCode as EnterInviteCodeClass,
} from 'src/invite/EnterInviteCode'
import { createMockStore, getMockI18nProps } from 'test/utils'

jest.mock('src/config', () => {
  return {
    ...jest.requireActual('src/config'),
    SHOW_GET_INVITE_LINK: true,
  }
})

const VALID_INVITE =
  'Something something pFCr5NAAf/vUcWypJiQFnF6DHI+6vCGxMhhShki07ow= another thing else'
const VALID_INVITE_KEY = '0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c'
const PARTIAL_INVITE =
  'Hi! I would like to invite you to join the Celo payments network. Your invite code is: ndoILWBXFR1+C59M3QKcEA7rWP7+2u5XQKC1gTemXBo= You can install the C'
const PARTIAL_INVITE_KEY = '0x9dda082d6057151d7e0b9f4cdd029c100eeb58fefedaee5740a0b58137a65c1a'
const VALID_REFERRER_INVITE = {
  clickTimestamp: '1573135549',
  installReferrer: 'invite-code=p9f1XCB7kRAgIbLvHhiGvx2Ps9HlWMkyEF9ywkj9xT8=',
  installTimestamp: '1573135556',
}
const VALID_REFERRER_INVITE_KEY =
  '0xa7d7f55c207b91102021b2ef1e1886bf1d8fb3d1e558c932105f72c248fdc53f'
const INVALID_REFERRER_INVITE = {
  clickTimestamp: '1573135549',
  installReferrer: 'invite-code=abc',
  installTimestamp: '1573135556',
}

SendIntentAndroid.openSMSApp = jest.fn()

const clipboardGetStringMock = (Clipboard.getString = jest.fn())
const getReferrerMock = RNInstallReferrer.getReferrer as jest.Mock

describe('EnterInviteCode Screen', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <EnterInviteCode {...getMockI18nProps()} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('works with partial invite text in clipboard', async () => {
    const redeem = jest.fn()
    clipboardGetStringMock.mockResolvedValue(PARTIAL_INVITE)
    const wrapper = render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          skipInvite={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          redeemComplete={false}
          isRedeemingInvite={false}
          isSkippingInvite={false}
          account={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    const input = wrapper.getByPlaceholder('inviteCodeText.codePlaceholder')
    fireEvent.changeText(input, VALID_INVITE)
    await flushMicrotasksQueue()
    expect(redeem).toHaveBeenCalledWith(PARTIAL_INVITE_KEY)
  })

  it('calls redeem invite with valid invite key in clipboard', async () => {
    const redeem = jest.fn()
    clipboardGetStringMock.mockResolvedValue(VALID_INVITE)
    render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          skipInvite={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          redeemComplete={false}
          isRedeemingInvite={false}
          isSkippingInvite={false}
          account={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    await flushMicrotasksQueue()
    expect(redeem).toHaveBeenCalledWith(VALID_INVITE_KEY)
  })

  it('does not proceed with an invalid invite key in clipboard', async () => {
    const redeem = jest.fn()
    clipboardGetStringMock.mockResolvedValue('abc')
    render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          skipInvite={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          redeemComplete={false}
          isRedeemingInvite={false}
          isSkippingInvite={false}
          account={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    await flushMicrotasksQueue()
    expect(redeem).not.toHaveBeenCalled()
  })

  it('calls redeem invite with valid invite key in install referrer data', async () => {
    const redeem = jest.fn()
    getReferrerMock.mockResolvedValue(VALID_REFERRER_INVITE)
    render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          skipInvite={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          redeemComplete={false}
          isRedeemingInvite={false}
          isSkippingInvite={false}
          account={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    await flushMicrotasksQueue()
    expect(redeem).toHaveBeenCalledWith(VALID_REFERRER_INVITE_KEY)
  })

  it('does not proceed with an invalid invite key in install referrer data', async () => {
    const redeem = jest.fn()
    getReferrerMock.mockResolvedValue(INVALID_REFERRER_INVITE)
    render(
      <Provider store={createMockStore()}>
        <EnterInviteCodeClass
          redeemInvite={redeem}
          skipInvite={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          redeemComplete={false}
          isRedeemingInvite={false}
          isSkippingInvite={false}
          account={null}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    await flushMicrotasksQueue()
    expect(redeem).not.toHaveBeenCalled()
  })
})
