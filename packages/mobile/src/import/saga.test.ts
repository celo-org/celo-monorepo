import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { setBackupCompleted } from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { storeMnemonic } from 'src/backup/utils'
import { refreshAllBalances } from 'src/home/actions'
import { importBackupPhraseFailure, importBackupPhraseSuccess } from 'src/import/actions'
import { importBackupPhraseSaga } from 'src/import/saga'
import { redeemInviteSuccess } from 'src/invite/actions'
import { fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { assignAccountFromPrivateKey, waitWeb3LastBlock } from 'src/web3/saga'
import { mockAccount } from 'test/values'

const mockPhraseValid =
  'oil please secret math suffer mesh retreat prosper quit traffic special creek educate rate weasel wide swing crystal day swim frost oxygen course expire'
const mockPhraseInvalid =
  'oilsome pleasely secretment math suffer mesh retreat prosper quit traffic special creek educate rate weasel wide swing crystal day swim frost oxygen course expire'
const mockValidSpanishPhrase =
  'tajo fiera asunto tono aroma palma toro caos lobo espada número rato hacha largo pedir cemento urbe tejado volcán mimo grueso juvenil pueblo desvío'

describe('Import wallet saga', () => {
  const expectSuccessfulSagaWithPhrase = async (phrase: string) => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, { phrase, useEmptyWallet: false })
      .provide([
        [call(waitWeb3LastBlock), true],
        [matchers.call.fn(fetchTokenBalanceInWeiWithRetry), new BigNumber(10)],
        [matchers.call.fn(assignAccountFromPrivateKey), mockAccount],
        [call(storeMnemonic, phrase, mockAccount), true],
      ])
      .put(setBackupCompleted())
      .put(redeemInviteSuccess())
      .put(refreshAllBalances())
      .put(importBackupPhraseSuccess())
      .run()
  }

  it('imports a valid phrase', async () => {
    await expectSuccessfulSagaWithPhrase(mockPhraseValid)
  })

  it('imports a valid spanish phrase', async () => {
    await expectSuccessfulSagaWithPhrase(mockValidSpanishPhrase)
  })

  const expectFailedSagaWithPhrase = async (phrase: string) => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, { phrase, useEmptyWallet: false })
      .provide([
        [call(waitWeb3LastBlock), true],
        [select(currentLanguageSelector), 'english'],
      ])
      .put(showError(ErrorMessages.INVALID_BACKUP_PHRASE))
      .put(importBackupPhraseFailure())
      .run()
  }

  it('fails for an invalid phrase', async () => {
    await expectFailedSagaWithPhrase(mockPhraseInvalid)
  })

  it('prevents import of an empty phrase', async () => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, { phrase: mockPhraseValid, useEmptyWallet: false })
      .provide([
        [call(waitWeb3LastBlock), true],
        [select(currentLanguageSelector), 'english'],
        [matchers.call.fn(fetchTokenBalanceInWeiWithRetry), new BigNumber(0)],
        [matchers.call.fn(fetchTokenBalanceInWeiWithRetry), new BigNumber(0)],
      ])
      .run()
  })
})
