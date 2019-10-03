jest.useFakeTimers()

import Button from '@celo/react-components/components/Button'
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import InviteReviewConnected, { InviteReview } from 'src/account/InviteReview'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockCountryCode, mockNavigation } from 'test/values'

jest.mock('src/geth/GethAwareButton', () => {
  return Button
})

jest.mock('src/identity/verification', () => {
  return { isPhoneVerified: jest.fn(() => true) }
})

jest.mock('src/web3/contracts', () => ({
  web3: {
    utils: {
      fromWei: jest.fn((x: any) => x / 1e18),
    },
  },
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('InviteReview', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore()}>
        {/*
          // @ts-ignore */}
        <InviteReviewConnected navigation={mockNavigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('On Invite', () => {
    const hideAlert = jest.fn()
    hideAlert.mockName('hideAlert')
    const sendInvite = jest.fn()
    sendInvite.mockName('sendInvite')

    const inviteReview = render(
      <Provider store={createMockStore()}>
        <InviteReview
          inviteInProgress={false}
          defaultCountryCode={mockCountryCode}
          dollarBalance={'100'}
          fetchDollarBalance={jest.fn()}
          hideAlert={hideAlert}
          showError={jest.fn()}
          sendInvite={sendInvite}
          {...getMockI18nProps()}
          // @ts-ignore
          navigation={mockNavigation}
        />
      </Provider>
    )

    it('clears the Error', async () => {
      fireEvent.press(inviteReview.getByTestId('inviteWhatsApp'))
      expect(hideAlert).toHaveBeenCalled()
    })
    it('sends Invite', async () => {
      fireEvent.press(inviteReview.getByTestId('inviteWhatsApp'))
      expect(sendInvite).toHaveBeenCalledWith('John Doe', '+14155550000', 'WhatsApp')
    })
  })
})
