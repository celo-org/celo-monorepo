import BigNumber from 'bignumber.js'
import { Linking } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'
import {
  InviteBy,
  redeemInvite,
  redeemInviteFailure,
  redeemInviteSuccess,
  sendInvite,
  storeInviteeData,
} from 'src/invite/actions'
import {
  generateInviteLink,
  watchRedeemInvite,
  watchSendInvite,
  withdrawFundsFromTempAccount,
} from 'src/invite/saga'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { transactionConfirmed } from 'src/transactions/actions'
import { contractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount, getOrCreateAccount, waitWeb3LastBlock } from 'src/web3/saga'
import { createMockStore, mockContractKitBalance } from 'test/utils'
import { mockAccount, mockE164Number } from 'test/values'

const mockKey = '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724'
const mockKeyEncoded = 'ESnrL7zNxmP0kjpklcNbCWJJgStYn3xM0dugHh7a9yQ='

jest.mock('src/firebase/dynamicLinks', () => ({
  ...jest.requireActual('src/firebase/dynamicLinks'),
  generateShortInviteLink: jest.fn(async () => 'http://celo.page.link/PARAMS'),
}))

jest.mock('src/utils/appstore', () => ({
  getAppStoreId: jest.fn(async () => 1482389446),
}))

jest.mock('src/account/actions', () => ({
  ...jest.requireActual('src/account/actions'),
  getPincode: async () => 'pin',
}))

jest.mock('src/transactions/send', () => ({
  sendTransaction: async () => true,
}))

jest.mock('src/web3/contracts', () => {
  const ck = require('@celo/contractkit').newKitFromWeb3
  return {
    contractKit: ck(),
    web3: {
      eth: {
        accounts: {
          privateKeyToAccount: () => mockAccount,
          wallet: {
            add: () => null,
          },
          create: () => ({
            address: mockAccount,
            privateKey: '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
          }),
        },
        personal: {
          importRawKey: () => mockAccount,
          unlockAccount: async () => true,
        },
      },
      utils: {
        fromWei: (x: any) => x / 1e18,
        sha3: () => `a sha3 hash`,
      },
    },
    isFornoMode: () => false,
  }
})

SendIntentAndroid.sendSms = jest.fn()

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
      ])
      .withState(state)
      .dispatch(sendInvite(mockE164Number, InviteBy.SMS))
      .dispatch(transactionConfirmed('a sha3 hash'))
      .put(storeInviteeData(mockAccount.toLowerCase(), mockKeyEncoded, mockE164Number))
      .run()

    expect(SendIntentAndroid.sendSms).toHaveBeenCalled()
  })

  it('sends a WhatsApp invite as expected', async () => {
    await expectSaga(watchSendInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getConnectedUnlockedAccount), mockAccount],
      ])
      .withState(state)
      .dispatch(sendInvite(mockE164Number, InviteBy.WhatsApp))
      .dispatch(transactionConfirmed('a sha3 hash'))
      .put(storeInviteeData(mockAccount.toLowerCase(), mockKeyEncoded, mockE164Number))
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
    // @ts-ignore
    contractKit.contracts.getStableToken.mockImplementation(async () => ({
      balanceOf: async () => {
        return new BigNumber(0)
      },
      decimals: async () => '10',
      transferWithComment: async () => ({
        txo: {},
      }),
    }))

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
  })

  it('fails with error creating account', async () => {
    // @ts-ignore
    contractKit.contracts.getStableToken.mockImplementation(async () => ({
      balanceOf: async () => {
        return new BigNumber(10)
      },
      decimals: async () => '10',
      transferWithComment: async () => ({
        txo: {},
      }),
    }))

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
      link: `https://celo.org/build/wallet`,
      playStoreUrl: `https://play.store.link&referrer=invite-code%3D${mockKey}`,
      appStoreUrl: 'https://app.store.link',
      bundleId: 'org.celo.mobile.alfajores',
    })
  })
})
