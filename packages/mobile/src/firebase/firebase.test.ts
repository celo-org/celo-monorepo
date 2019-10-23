import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { currentLanguageSelector } from 'src/app/reducers'
import { initializeCloudMessaging, registerTokenToDb, setUserLanguage } from 'src/firebase/firebase'
import { mockAccount2 } from 'test/values'

const hasPermissionMock = jest.fn(() => null)
const requestPermissionMock = jest.fn(() => null)
const getTokenMock = jest.fn(() => null)
const onTokenRefreshMock = jest.fn(() => null)
const onNotificationMock = jest.fn((fn) => null)
const onNotificationOpenedMock = jest.fn((fn) => null)
const getInitialNotificationMock = jest.fn(() => null)

const address = mockAccount2
const mockFcmToken = 'token'

const app: any = {
  messaging: () => ({
    hasPermission: hasPermissionMock,
    requestPermission: requestPermissionMock,
    getToken: getTokenMock,
    onTokenRefresh: onTokenRefreshMock,
  }),
  notifications: () => ({
    onNotification: onNotificationMock,
    onNotificationOpened: onNotificationOpenedMock,
    getInitialNotification: getInitialNotificationMock,
  }),
}

describe(initializeCloudMessaging, () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it("Firebase doesn't have permission", async () => {
    const errorToRaise = new Error('No permission')
    let catchedError

    await expectSaga(initializeCloudMessaging, app, address)
      .provide([
        [call([app.messaging(), 'hasPermission']), false],
        [call([app.messaging(), 'requestPermission']), throwError(errorToRaise)],
        {
          spawn(effect, next) {
            // mock all spawns
            return
          },
        },
      ])
      .run()
      .catch((error: Error) => {
        catchedError = error
      })

    expect(errorToRaise).toEqual(catchedError)
  })

  it('Firebase has permission', async () => {
    const mockLanguage = 'en_US'
    await expectSaga(initializeCloudMessaging, app, address)
      .provide([
        [call([app.messaging(), 'hasPermission']), true],
        [call([app.messaging(), 'getToken']), mockFcmToken],
        [call(registerTokenToDb, app, address, mockFcmToken), null],
        [select(currentLanguageSelector), mockLanguage],
        [call(setUserLanguage, address, mockLanguage), null],
        {
          spawn(effect, next) {
            // mock all spawns
            return
          },
        },
      ])
      .call(registerTokenToDb, app, address, mockFcmToken)
      .call(setUserLanguage, address, mockLanguage)
      .run()
  })
})
