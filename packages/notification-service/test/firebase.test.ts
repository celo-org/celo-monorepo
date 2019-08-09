import * as admin from 'firebase-admin'
import { Currencies } from '../src/blockscout/transfers'
import { sendPaymentNotification, _setTestRegistrations } from '../src/firebase'

const messagingMock = {
  send: jest.fn(),
}

jest.mock('firebase-admin', () => ({
  messaging() {
    return messagingMock
  },
}))

const mockedMessagingSend = admin.messaging().send as jest.Mock

describe('sendPaymentNotification', () => {
  beforeEach(() => {
    mockedMessagingSend.mockClear()
  })

  it('should send a payment notification', async () => {
    expect.hasAssertions()

    _setTestRegistrations({ '0xabc': { fcmToken: 'TEST_FCM_TOKEN' } })

    await sendPaymentNotification('0xabc', '10', Currencies.DOLLAR, {})

    expect(mockedMessagingSend).toHaveBeenCalledTimes(1)
    expect(mockedMessagingSend.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "android": Object {
            "notification": Object {
              "color": "#42D689",
              "icon": "ic_stat_rings",
            },
            "priority": "high",
            "ttl": 604800000,
          },
          "data": Object {
            "type": "PAYMENT_RECEIVED",
          },
          "notification": Object {
            "body": "You've received 10 Celo Dollars",
            "title": "Payment Received",
          },
          "token": "TEST_FCM_TOKEN",
        },
        true,
      ]
    `)
  })
})
