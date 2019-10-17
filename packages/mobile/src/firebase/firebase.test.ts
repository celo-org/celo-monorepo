import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { currentLanguageSelector } from 'src/app/reducers'
import {
  initializeCloudMessaging,
  setUserLanguage,
  _registerTokenToDb,
} from 'src/firebase/firebase'

const hasPermissionMock = jest.fn(() => {})
const requestPermissionMock = jest.fn(() => {})
const getTokenMock = jest.fn(() => {})
const onTokenRefreshMock = jest.fn(() => {})
const onNotificationMock = jest.fn((fn) => {})
const onNotificationOpenedMock = jest.fn((fn) => {})
const getInitialNotificationMock = jest.fn(() => {})

const address = 'MyAddress'
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
  // beforeAll(() => {
  //   jest.useRealTimers()
  // })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("Firebase doesn't have permission", async () => {
    const errorToRaise = new Error('No permission')
    let catchedError

    await expectSaga(initializeCloudMessaging, app, address)
      .provide([
        [call(hasPermissionMock), false],
        [call(requestPermissionMock), throwError(errorToRaise)],
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
        [call(hasPermissionMock), false],
        [call(app.messaging().getToken), mockFcmToken],
        [call(_registerTokenToDb, app, address, mockFcmToken), null],
        [select(currentLanguageSelector), mockLanguage],
        [call(setUserLanguage, address, mockLanguage), null],
      ])
      .call(_registerTokenToDb, app, address, mockFcmToken)
      .run()
  })
})
