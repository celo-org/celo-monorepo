const { mockNavigationServiceFor } = require('test/utils')
const { navigateReset } = mockNavigationServiceFor('invite/saga')

import { FetchMock } from 'jest-fetch-mock'
import { Linking } from 'react-native'
import SmsAndroid from 'react-native-sms-android'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { setName } from 'src/account'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION } from 'src/config'
import {
  InviteBy,
  redeemComplete,
  redeemInvite,
  sendInvite,
  storeInviteeData,
} from 'src/invite/actions'
import { watchRedeemInvite, watchSendInvite } from 'src/invite/saga'
import { transactionConfirmed } from 'src/transactions/actions'
import { currentAccountSelector } from 'src/web3/selectors'
import { createMockContract, createMockStore } from 'test/utils'
import { mockAccount, mockE164Number, mockName } from 'test/values'

const fetchMock = fetch as FetchMock

const KEY = '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724'
const NAME = 'Celonius'

const balance = jest.fn(() => 10)
jest.mock('@celo/contractkit', () => ({
  ...jest.requireActual('@celo/contractkit'),
  getAttestationsContract: async () =>
    createMockContract({ getAttestationRequestFee: Math.pow(10, 18) }),
  getStableTokenContract: jest.fn(async () =>
    createMockContract({
      balanceOf: balance,
      transfer: () => null,
      transferWithComment: () => null,
      decimals: () => '10',
    })
  ),
}))

jest.mock('src/account/actions', () => ({
  ...jest.requireActual('src/account/actions'),
  getPincode: async () => 'pin',
}))

jest.mock('src/invite/actions', () => ({
  ...jest.requireActual('src/invite/actions'),
  redeemComplete: () => jest.fn(),
}))

jest.mock('src/transactions/send', () => ({
  sendTransaction: async () => true,
}))

const state = createMockStore({ web3: { account: mockAccount } }).getState()

describe(watchSendInvite, () => {
  beforeAll(() => {
    jest.useRealTimers()

    fetchMock.mockResponse(
      JSON.stringify({
        shortLink: 'hi',
      })
    )
  })

  it('sends an SMS invite as expected', async () => {
    await expectSaga(watchSendInvite)
      .withState(state)
      .dispatch(sendInvite(mockName, mockE164Number, InviteBy.SMS))
      .dispatch(transactionConfirmed('a sha3 hash'))
      .put(storeInviteeData(KEY, mockE164Number))
      .run()

    expect(SmsAndroid.sms).toHaveBeenCalled()
  })

  it('sends a WhatsApp invite as expected', async () => {
    await expectSaga(watchSendInvite)
      .withState(state)
      .dispatch(sendInvite(mockName, mockE164Number, InviteBy.WhatsApp))
      .put(storeInviteeData(KEY, mockE164Number))
      .dispatch(transactionConfirmed('a sha3 hash'))
      .run()

    expect(Linking.openURL).toHaveBeenCalled()
  })
})

describe(watchRedeemInvite, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    balance.mockReset()
    navigateReset.mockReset()
  })

  it('works with a valid private key and enough money on it', async () => {
    balance
      .mockReturnValueOnce(10) // temp account
      .mockReturnValueOnce(10) // new account

    await expectSaga(watchRedeemInvite)
      .withState(state)
      .dispatch(redeemInvite(KEY, NAME))
      .put(setName(NAME))
      .dispatch(redeemComplete(true))
      .run()
  })

  it('fails with a valid private key but unsuccessful transfer', async () => {
    balance
      .mockReturnValueOnce(10) // temp account
      .mockReturnValueOnce(0) // new account

    await expectSaga(watchRedeemInvite)
      .withState(state)
      .dispatch(redeemInvite(KEY, NAME))
      .put(showError(ErrorMessages.REDEEM_INVITE_FAILED, ERROR_BANNER_DURATION))
      .run()
  })

  it('fails with a valid private key but no money on key', async () => {
    balance
      .mockReturnValueOnce(0) // temp account
      .mockReturnValueOnce(0) // current account

    await expectSaga(watchRedeemInvite)
      .withState(state)
      .dispatch(redeemInvite(KEY, NAME))
      .put(showError(ErrorMessages.REDEEM_INVITE_FAILED, ERROR_BANNER_DURATION))
      .run()
  })

  it('fails with no money and no account', async () => {
    balance.mockReturnValueOnce(0) // temp account

    await expectSaga(watchRedeemInvite)
      .withState(state)
      .provide([[select(currentAccountSelector), null]])
      .dispatch(redeemInvite(KEY, NAME))
      .put(showError(ErrorMessages.REDEEM_INVITE_FAILED, ERROR_BANNER_DURATION))
      .run()
  })

  it('works with no money on key but money in account', async () => {
    balance
      .mockReturnValueOnce(0) // temp account
      .mockReturnValueOnce(10) // current account

    await expectSaga(watchRedeemInvite)
      .withState(state)
      .dispatch(redeemInvite(KEY, NAME))
      .put(setName(NAME))
      .dispatch(redeemComplete(true))
      .run()
  })
})
