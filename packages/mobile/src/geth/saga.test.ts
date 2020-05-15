import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { pincodeTypeSelector } from 'src/account/selectors'
import { currentAccountSelector } from 'src/geth/selectors'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'
import { getOrCreateAccount } from './saga'

jest.mock('src/account/actions', () => ({
  ...jest.requireActual('src/account/actions'),
  getPincode: async () => 'pin',
}))

jest.mock('src/navigator/NavigationService', () => ({
  navigateToError: jest.fn().mockReturnValueOnce(undefined),
}))

const state = createMockStore({ geth: { account: mockAccount } }).getState()

describe(getOrCreateAccount, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('returns an existing account', async () => {
    await expectSaga(getOrCreateAccount)
      .withState(state)
      .provide([[select(currentAccountSelector), '123']])
      .returns('123')
      .run()
  })

  it('creates a new account', async () => {
    await expectSaga(getOrCreateAccount)
      .withState(state)
      .provide([[select(currentAccountSelector), null]])
      .provide([[select(pincodeTypeSelector), '123']])
      .returns('0x0000000000000000000000000000000000007e57')
      .run()
  })
})
