import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { initializeCloudMessaging, _registerTokenToDb } from 'src/firebase/firebase'

const hasPermission = jest.fn(() => {})
const requestPermission = jest.fn(() => {})
const getToken = jest.fn(() => {})
const onTokenRefresh = jest.fn(() => {})

const address = 'MyAddress'
const mockFcmToken = 'token'

const app: any = {
  messaging: () => ({
    hasPermission: hasPermission,
    requestPermission: requestPermission,
    getToken: getToken,
    onTokenRefresh: onTokenRefresh,
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
      .provide([[call(hasPermission), false], [call(requestPermission), throwError(errorToRaise)]])
      .run()
      .catch((error) => {
        catchedError = error
      })

    expect(errorToRaise).toEqual(catchedError)
    console.log('Todo bien')
  })

  it('Firebase has permission', async () => {
    await expectSaga(initializeCloudMessaging, app, address)
      .provide([
        [call(hasPermission), false],
        [call(app.messaging().getToken), mockFcmToken],
        [call(_registerTokenToDb, app, address, mockFcmToken), null],
      ])
      .call(_registerTokenToDb, app, address, mockFcmToken)
      .run()
  })
})
