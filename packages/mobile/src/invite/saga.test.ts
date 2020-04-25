import BigNumber from 'bignumber.js'
import { Linking } from 'react-native'
import SendSMS from 'react-native-sms'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { transferEscrowedPayment } from 'src/escrow/actions'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'
import {
  InviteBy,
  redeemInvite,
  redeemInviteFailure,
  redeemInviteSuccess,
  sendInvite,
  SENTINEL_INVITE_COMMENT,
  storeInviteeData,
} from 'src/invite/actions'
import {
  generateInviteLink,
  watchRedeemInvite,
  watchSendInvite,
  withdrawFundsFromTempAccount,
} from 'src/invite/saga'
import { getSendFee } from 'src/send/saga'
import { fetchDollarBalance, transferStableToken } from 'src/stableToken/actions'
import { transactionConfirmed } from 'src/transactions/actions'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount, getOrCreateAccount, waitWeb3LastBlock } from 'src/web3/saga'
import { createMockStore, mockContractKitBalance } from 'test/utils'
import { mockAccount, mockInviteDetails3 } from 'test/values'

const mockKey = '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724'

jest.mock('src/firebase/dynamicLinks', () => ({
  ...jest.requireActual('src/firebase/dynamicLinks'),
  generateShortInviteLink: jest.fn(async () => 'http://celo.page.link/PARAMS'),
}))

jest.mock('src/utils/appstore', () => ({
  getAppStoreId: jest.fn(async () => '1482389446'),
}))

jest.mock('src/account/actions', () => ({
  ...jest.requireActual('src/account/actions'),
  getPincode: async () => 'pin',
}))

jest.mock('src/transactions/send', () => ({
  sendTransaction: async () => true,
}))

jest.mock('@celo/contractkit')

SendSMS.send = jest.fn()

const state = createMockStore({ web3: { account: mockAccount } }).getState()

describe(watchSendInvite, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('sends an SMS invite as expected', async () => {
    await expectSaga(watchSendInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getConnectedUnlockedAccount), mockAccount],
        [matchers.call.fn(waitForTransactionWithId), mockInviteDetails3.escrowTxId],
      ])
      .withState(state)
      .dispatch(
        sendInvite(
          mockInviteDetails3.e164Number,
          InviteBy.SMS,
          mockInviteDetails3.escrowAmount,
          mockInviteDetails3.escrowCurrency
        )
      )
      .dispatch(transactionConfirmed('a sha3 hash'))
      .put(
        transferStableToken({
          recipientAddress: mockAccount,
          amount: '0.25',
          comment: SENTINEL_INVITE_COMMENT,
          txId: 'a sha3 hash',
        })
      )
      .put(
        transferEscrowedPayment(
          '0x4f1ab32ca80add38c067f020202592cd0a2a9fb7a01cd538e731871ed6547e1a',
          new BigNumber(mockInviteDetails3.escrowAmount),
          mockAccount,
          'a sha3 hash'
        )
      )
      .put(storeInviteeData(mockInviteDetails3))
      .run()

    expect(SendSMS.send).toHaveBeenCalled()
  })

  it('sends a WhatsApp invite as expected', async () => {
    await expectSaga(watchSendInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getConnectedUnlockedAccount), mockAccount],
        [matchers.call.fn(waitForTransactionWithId), mockInviteDetails3.escrowTxId],
      ])
      .withState(state)
      .dispatch(
        sendInvite(
          mockInviteDetails3.e164Number,
          InviteBy.WhatsApp,
          mockInviteDetails3.escrowAmount,
          mockInviteDetails3.escrowCurrency
        )
      )
      .dispatch(transactionConfirmed('a sha3 hash'))
      .put(
        transferStableToken({
          recipientAddress: mockAccount,
          amount: '0.25',
          comment: SENTINEL_INVITE_COMMENT,
          txId: 'a sha3 hash',
        })
      )
      .put(
        transferEscrowedPayment(
          '0x4f1ab32ca80add38c067f020202592cd0a2a9fb7a01cd538e731871ed6547e1a',
          new BigNumber(mockInviteDetails3.escrowAmount),
          mockAccount,
          'a sha3 hash'
        )
      )
      .put(storeInviteeData(mockInviteDetails3))
      .run()

    expect(Linking.openURL).toHaveBeenCalled()
  })
})

describe(watchRedeemInvite, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    mockContractKitBalance.mockReset()
  })

  it('works with a valid private key and enough money on it', async () => {
    await expectSaga(watchRedeemInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getOrCreateAccount), mockAccount],
        [matchers.call.fn(getSendFee), 0.1],
      ])
      .withState(state)
      .dispatch(redeemInvite(mockKey))
      .put(fetchDollarBalance())
      .put(redeemInviteSuccess())
      .run()
  })

  it('fails with a valid private key but unsuccessful transfer', async () => {
    await expectSaga(watchRedeemInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getOrCreateAccount), mockAccount],
        [matchers.call.fn(withdrawFundsFromTempAccount), throwError(new Error('fake error'))],
      ])
      .withState(state)
      .dispatch(redeemInvite(mockKey))
      .put(showError(ErrorMessages.REDEEM_INVITE_FAILED))
      .put(redeemInviteFailure())
      .run()
  })

  it('fails with a valid private key but no money on key', async () => {
    const stableToken = await getContractKit().contracts.getStableToken()

    // @ts-ignore Jest Mock
    stableToken.balanceOf.mockResolvedValue(new BigNumber(0))

    await expectSaga(watchRedeemInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getOrCreateAccount), mockAccount],
      ])
      .withState(state)
      .dispatch(redeemInvite(mockKey))
      .put(showError(ErrorMessages.EMPTY_INVITE_CODE))
      .put(redeemInviteFailure())
      .run()

    // @ts-ignore Jest Mock
    stableToken.balanceOf.mockReset()
  })

  it('fails with error creating account', async () => {
    await expectSaga(watchRedeemInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getOrCreateAccount), throwError(new Error('fake error'))],
      ])
      .withState(state)
      .dispatch(redeemInvite(mockKey))
      .put(showError(ErrorMessages.REDEEM_INVITE_FAILED))
      .put(redeemInviteFailure())
      .run()
  })
})

describe(generateInviteLink, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Generate invite link correctly', async () => {
    const result = await generateInviteLink(mockKey)
    expect(result).toBe('http://celo.page.link/PARAMS')
    expect(generateShortInviteLink).toBeCalledTimes(1)
    expect(generateShortInviteLink).toHaveBeenCalledWith({
      link: `https://celo.org/build/wallet?invite-code=${mockKey}`,
      appStoreId: '1482389446',
      bundleId: 'org.celo.mobile.alfajores',
    })
  })
})
