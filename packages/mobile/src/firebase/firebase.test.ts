import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { currentLanguageSelector } from 'src/app/reducers'
import {
  initializeCloudMessaging,
  isVersionBelowMinimum,
  registerTokenToDb,
  setUserLanguage,
} from 'src/firebase/firebase'
import { mockAccount2 } from 'test/values'

const hasPermissionMock = jest.fn(() => null)
const requestPermissionMock = jest.fn(() => null)
const registerDeviceForRemoteMessagesMock = jest.fn(() => null)
const getTokenMock = jest.fn(() => null)
const onTokenRefreshMock = jest.fn(() => null)
const onMessageMock = jest.fn(() => null)
const onNotificationOpenedAppMock = jest.fn(() => null)
const getInitialNotificationMock = jest.fn(() => null)
const setBackgroundMessageHandler = jest.fn(() => null)

const address = mockAccount2
const mockFcmToken = 'token'

const app: any = {
  messaging: () => ({
    hasPermission: hasPermissionMock,
    requestPermission: requestPermissionMock,
    registerDeviceForRemoteMessages: registerDeviceForRemoteMessagesMock,
    getToken: getTokenMock,
    onTokenRefresh: onTokenRefreshMock,
    setBackgroundMessageHandler,
    onMessage: onMessageMock,
    onNotificationOpenedApp: onNotificationOpenedAppMock,
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

describe('Firebase version check', () => {
  it('Correctly check if version is deprecated', () => {
    expect(isVersionBelowMinimum('1.5.0', '1.4.0')).toBe(false)
    expect(isVersionBelowMinimum('1.4.0', '1.5.0')).toBe(true)
    expect(isVersionBelowMinimum('1.4.0', '1.4.0')).toBe(false)
    expect(isVersionBelowMinimum('1.4.0', '1.4.0.1')).toBe(true)
  })
})
