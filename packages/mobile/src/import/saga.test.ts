import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { setBackupCompleted } from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { refreshAllBalances } from 'src/home/actions'
import {
  backupPhraseEmpty,
  importBackupPhraseFailure,
  importBackupPhraseSuccess,
} from 'src/import/actions'
import { importBackupPhraseSaga } from 'src/import/saga'
import { redeemInviteSuccess } from 'src/invite/actions'
import { fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { setKey } from 'src/utils/keyStore'
import { assignAccountFromPrivateKey, waitWeb3LastBlock } from 'src/web3/saga'
import { mockAccount } from 'test/values'

const mockPhraseValid =
  'oil please secret math suffer mesh retreat prosper quit traffic special creek educate rate weasel wide swing crystal day swim frost oxygen course expire'
const mockPhraseInvalid =
  'oilsome pleasely secretment math suffer mesh retreat prosper quit traffic special creek educate rate weasel wide swing crystal day swim frost oxygen course expire'

describe('Import wallet saga', () => {
  it('imports a valid phrase', async () => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, { phrase: mockPhraseValid, useEmptyWallet: false })
      .provide([
        [call(waitWeb3LastBlock), true],
        [matchers.call.fn(fetchTokenBalanceInWeiWithRetry), new BigNumber(10)],
        [matchers.call.fn(assignAccountFromPrivateKey), mockAccount],
        [call(setKey, 'mnemonic', mockPhraseValid), true],
      ])
      .put(setBackupCompleted())
      .put(redeemInviteSuccess())
      .put(refreshAllBalances())
      .put(importBackupPhraseSuccess())
      .run()
  })

  it('fails for an invalid phrase', async () => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, { phrase: mockPhraseInvalid, useEmptyWallet: false })
      .provide([[call(waitWeb3LastBlock), true]])
      .put(showError(ErrorMessages.INVALID_BACKUP_PHRASE))
      .put(importBackupPhraseFailure())
      .run()
  })

  it('prevents import of an empty phrase', async () => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, { phrase: mockPhraseValid, useEmptyWallet: false })
      .provide([
        [call(waitWeb3LastBlock), true],
        [matchers.call.fn(fetchTokenBalanceInWeiWithRetry), new BigNumber(0)],
      ])
      .put(backupPhraseEmpty())
      .run()
  })
})
