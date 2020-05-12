import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { DAYS_TO_BACKUP } from 'src/backup/utils'
import NotificationBox from 'src/home/NotificationBox'
import { createMockStore, getElementText } from 'test/utils'
import { mockPaymentRequests } from 'test/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 1000
const RECENT_BACKUP_TIME = new Date().getTime() - TWO_DAYS_MS
const EXPIRED_BACKUP_TIME = RECENT_BACKUP_TIME - DAYS_TO_BACKUP

const storeDataNotificationsEnabled = {
  goldToken: { educationCompleted: false },
  account: {
    backupCompleted: false,
    dismissedEarnRewards: false,
    dismissedInviteFriends: false,
    dismissedGetVerified: false,
    accountCreationTime: EXPIRED_BACKUP_TIME,
    incomingPaymentRequests: mockPaymentRequests.slice(0, 2),
  },
}

const storeDataNotificationsDisabled = {
  goldToken: { educationCompleted: true },
  account: {
    backupCompleted: true,
    dismissedEarnRewards: true,
    dismissedInviteFriends: true,
    dismissedGetVerified: true,
    accountCreationTime: RECENT_BACKUP_TIME,
    incomingPaymentRequests: [],
  },
}

describe('NotificationBox', () => {
  it('renders correctly for with all notifications', () => {
    const store = createMockStore({
      ...storeDataNotificationsEnabled,
    })
    const tree = renderer.create(
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
        dismissedEarnRewards: false,
        dismissedInviteFriends: false,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('exchangeFlow9:whatIsGold')).toBeTruthy()
    expect(getByText('inviteFlow11:inviteFriendsToCelo')).toBeTruthy()
  })

  it('renders incoming payment request when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
        incomingPaymentRequests: [mockPaymentRequests[0]],
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    const element = getByTestId('IncomingPaymentRequestNotification/FAKE_ID_1/Title')
    expect(getElementText(element)).toBe('+14155550000 requested $266,000.00')
  })

  it('renders incoming payment requests when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
        incomingPaymentRequests: mockPaymentRequests,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('incomingPaymentRequests')).toBeTruthy()
  })

  it('renders outgoing payment requests when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
        outgoingPaymentRequests: mockPaymentRequests,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('outgoingPaymentRequests')).toBeTruthy()
  })

  it('renders outgoing payment request when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
        outgoingPaymentRequests: [mockPaymentRequests[0]],
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    const element = getByTestId('OutgoingPaymentRequestNotification/FAKE_ID_1/Title')
    expect(getElementText(element)).toBe('Requested $266,000.00 from +14155550000')
  })

  it('renders verification reminder when not verified', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
        dismissedGetVerified: false,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('nuxVerification2:notification.title')).toBeTruthy()
  })
})
