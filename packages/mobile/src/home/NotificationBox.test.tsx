import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { DAYS_TO_BACKUP } from 'src/backup/utils'
import NotificationBox from 'src/home/NotificationBox'
import { createMockStore, getElementText } from 'test/utils'
import { mockE164Number, mockE164NumberPepper, mockPaymentRequests } from 'test/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 1000
const RECENT_BACKUP_TIME = new Date().getTime() - TWO_DAYS_MS
const EXPIRED_BACKUP_TIME = RECENT_BACKUP_TIME - DAYS_TO_BACKUP

const storeDataNotificationsEnabled = {
  goldToken: { educationCompleted: false },
  account: {
    backupCompleted: false,
    dismissedInviteFriends: false,
    dismissedGetVerified: false,
    accountCreationTime: EXPIRED_BACKUP_TIME,
  },
  paymentRequest: {
    incomingPaymentRequests: mockPaymentRequests.slice(0, 2),
  },
}

const storeDataNotificationsDisabled = {
  goldToken: { educationCompleted: true },
  account: {
    backupCompleted: true,
    dismissedInviteFriends: true,
    dismissedGetVerified: true,
    accountCreationTime: RECENT_BACKUP_TIME,
  },
  paymentRequest: {
    incomingPaymentRequests: [],
  },
}

describe('NotificationBox', () => {
  it('renders correctly for with all notifications', () => {
    const store = createMockStore({
      ...storeDataNotificationsEnabled,
      account: {
        ...storeDataNotificationsEnabled.account,
        e164PhoneNumber: mockE164Number,
      },
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      stableToken: { balance: '0.00' },
      goldToken: { balance: '0.00' },
    })
    const tree = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders backup when backup is late', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        backupCompleted: false,
        accountCreationTime: EXPIRED_BACKUP_TIME,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('backupKeyFlow6:backupKeyNotification')).toBeTruthy()
  })

  it('renders educations when not complete yet', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      goldToken: { educationCompleted: false },
      account: {
        ...storeDataNotificationsDisabled.account,
        dismissedInviteFriends: false,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('exchangeFlow9:whatIsGold')).toBeTruthy()
    // Functionality disabled for now
    // expect(getByText('inviteFlow11:inviteAnyone')).toBeTruthy()
  })

  it('renders incoming payment request when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
      },
      paymentRequest: {
        incomingPaymentRequests: [mockPaymentRequests[0]],
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    const titleElement = getByTestId('IncomingPaymentRequestNotification/FAKE_ID_1/Title')
    expect(getElementText(titleElement)).toBe('incomingPaymentRequestNotificationTitle')
    const amountElement = getByTestId('IncomingPaymentRequestNotification/FAKE_ID_1/Amount')
    expect(getElementText(amountElement)).toBe('$266,000.00')
    const detailsElement = getByTestId('IncomingPaymentRequestNotification/FAKE_ID_1/Details')
    expect(getElementText(detailsElement)).toBe('Dinner for me and the gals, PIZZAA!')
  })

  it('renders incoming payment requests when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
      },
      paymentRequest: {
        incomingPaymentRequests: mockPaymentRequests,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('incomingPaymentRequestsSummaryTitle')).toBeTruthy()
  })

  it('renders outgoing payment requests when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
      },
      paymentRequest: {
        outgoingPaymentRequests: mockPaymentRequests,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('outgoingPaymentRequestsSummaryTitle')).toBeTruthy()
  })

  it('renders outgoing payment request when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
      },
      paymentRequest: {
        outgoingPaymentRequests: [mockPaymentRequests[0]],
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    const titleElement = getByTestId('OutgoingPaymentRequestNotification/FAKE_ID_1/Title')
    expect(getElementText(titleElement)).toBe('outgoingPaymentRequestNotificationTitle')
    const amountElement = getByTestId('OutgoingPaymentRequestNotification/FAKE_ID_1/Amount')
    expect(getElementText(amountElement)).toBe('$266,000.00')
    const detailsElement = getByTestId('OutgoingPaymentRequestNotification/FAKE_ID_1/Details')
    expect(getElementText(detailsElement)).toBe('Dinner for me and the gals, PIZZAA!')
  })

  it('renders verification reminder when not verified', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
        dismissedGetVerified: false,
        e164PhoneNumber: mockE164Number,
      },
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      stableToken: { balance: '0.00' },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('nuxVerification2:notification.body')).toBeTruthy()
  })

  it('does not render verification reminder when insufficient balance', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
    })
    const { queryByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(queryByText('nuxVerification2:notification.body')).toBeFalsy()
  })
})
