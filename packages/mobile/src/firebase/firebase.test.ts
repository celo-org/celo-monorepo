import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { initializeCloudMessaging } from '/src/firebase/firebase'

describe(initializeCloudMessaging, () => {
  // beforeAll(() => {
  //   jest.useRealTimers()
  // })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("Firebase doesn't have permission", async () => {
    const app: any = { messaging: () => ({ hasPermission: undefined }) }
    // console.log(initializeCloudMessaging)
    await expectSaga(initializeCloudMessaging, app, '').provide([
      [call(app.messaging().hasPermission), false],
      // [select(recipientCacheSelector), {}]
    ])
  })
})
