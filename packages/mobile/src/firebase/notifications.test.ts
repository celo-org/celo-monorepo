import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { SendOrigin } from 'src/analytics/types'
import { openUrl } from 'src/app/actions'
import { handleNotification } from 'src/firebase/notifications'
import { addressToDisplayNameSelector, addressToE164NumberSelector } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NotificationReceiveState, NotificationTypes } from 'src/notifications/types'
import { recipientCacheSelector } from 'src/recipients/reducer'

describe(handleNotification, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('with a simple notification', () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.APP_ALREADY_OPEN)
        .put(showMessage('My Body', undefined, null, null, 'My title'))
        .run()
    })

    it('has no effect if the app is not already in the foreground', async () => {
      const result = await expectSaga(
        handleNotification,
        message,
        NotificationReceiveState.APP_OPENED_FRESH
      ).run()

      expect(result.toJSON()).toEqual({})
    })
  })

  describe("with a notification with an 'open url' semantic", () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
      data: { ou: 'https://celo.org' },
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.APP_ALREADY_OPEN)
        .put(
          showMessage(
            'My Body',
            undefined,
            null,
            openUrl('https://celo.org', false, true),
            'My title'
          )
        )
        .run()
    })

    it('directly opens the url if the app is not already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.APP_OPENED_FRESH)
        .put(openUrl('https://celo.org', false, true))
        .run()
    })

    it('directly opens the url externally if the app is not already in the foreground and openExternal is true', async () => {
      await expectSaga(
        handleNotification,
        { ...message, data: { ou: message.data.ou, openExternal: 'true' } },
        NotificationReceiveState.APP_OPENED_FRESH
      )
        .put(openUrl(message.data.ou, true, true))
        .run()
    })
  })

  describe("with a notification with an 'open url' semantic and a deep link", () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
      data: { ou: `celo://wallet/openScreen?screen=${Screens.WalletHome}` },
    }

    it('fires  an event to open the deep link', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.APP_OPENED_FRESH)
        .put(openUrl(message.data.ou, false, true))
        .run()
    })
  })

  describe('with a payment received notification', () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
      data: {
        type: NotificationTypes.PAYMENT_RECEIVED,
        sender: '0xTEST',
        value: '10',
        currency: 'dollar',
        timestamp: 1,
      },
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.APP_ALREADY_OPEN)
        .put(showMessage('My Body', undefined, null, null, 'My title'))
        .run()

      expect(navigate).not.toHaveBeenCalled()
    })

    it('navigates to the transaction review screen if the app is not already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.APP_OPENED_FRESH)
        .provide([
          [select(addressToE164NumberSelector), {}],
          [select(recipientCacheSelector), {}],
          [select(addressToDisplayNameSelector), {}],
        ])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.TransactionReview, {
        confirmationProps: {
          address: '0xtest',
          amount: { currencyCode: 'cUSD', value: new BigNumber('1e-17') },
          comment: undefined,
          recipient: undefined,
          type: 'RECEIVED',
        },
        reviewProps: {
          header: 'walletFlow5:transactionHeaderReceived',
          timestamp: 1,
          type: 'RECEIVED',
        },
      })
    })
  })

  describe('with a payment request notification', () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
      data: {
        type: NotificationTypes.PAYMENT_REQUESTED,
        uid: 'abc',
        requesterAddress: '0xTEST',
        amount: '10',
        currency: 'dollar',
        comment: 'Pizza',
      },
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.APP_ALREADY_OPEN)
        .put(showMessage('My Body', undefined, null, null, 'My title'))
        .run()

      expect(navigate).not.toHaveBeenCalled()
    })

    it('navigates to the send confirmation screen if the app is not already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.APP_OPENED_FRESH)
        .provide([
          [select(addressToE164NumberSelector), {}],
          [select(recipientCacheSelector), {}],
        ])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
        origin: SendOrigin.AppRequestFlow,
        transactionData: {
          amount: new BigNumber('10'),
          firebasePendingRequestUid: 'abc',
          reason: 'Pizza',
          recipient: { address: '0xTEST', displayName: '0xTEST', kind: 'Address' },
          type: 'PAY_REQUEST',
        },
      })
    })
  })
})
