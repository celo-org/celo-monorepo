import * as React from 'react'
import { Platform } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import SendSMS from 'react-native-sms'
import { fireEvent, flushMicrotasksQueue, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { createMockStore } from 'test/utils'
import { mockEscrowedPayment, mockInviteDetails, mockInviteDetails2 } from 'test/values'

const store = createMockStore()
SendIntentAndroid.sendSms = jest.fn()
SendSMS.send = jest.fn()

describe('EscrowedPaymentReminderNotification', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentListItem
          payment={mockEscrowedPayment}
          invitees={[mockInviteDetails, mockInviteDetails2]}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('sends an SMS reminder on Android as expected', async () => {
    Platform.OS = 'android'
    const contact = render(
      <Provider store={store}>
        <EscrowedPaymentListItem
          payment={mockEscrowedPayment}
          invitees={[mockInviteDetails, mockInviteDetails2]}
        />
      </Provider>
    )

    fireEvent.press(contact.getByTestId('EscrowedPaymentListItem/global:remind/Button'))
    await flushMicrotasksQueue()
    expect(SendIntentAndroid.sendSms).toHaveBeenCalled()
  })

  it('sends an SMS reminder on iOS as expected', async () => {
    Platform.OS = 'ios'
    const contact = render(
      <Provider store={store}>
        <EscrowedPaymentListItem
          payment={mockEscrowedPayment}
          invitees={[mockInviteDetails, mockInviteDetails2]}
        />
      </Provider>
    )

    fireEvent.press(contact.getByTestId('EscrowedPaymentListItem/global:remind/Button'))
    await flushMicrotasksQueue()
    expect(SendSMS.send).toHaveBeenCalled()
  })
})
