import { generateKeys, validateMnemonic } from '@celo/utils/src/account'
import { ensureLeading0x } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import * as bip39 from 'react-native-bip39'
import { call, put, spawn, takeLeading } from 'redux-saga/effects'
import { setBackupCompleted } from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { assignAccountFromPrivateKey } from 'src/geth/saga'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  backupPhraseEmpty,
  ImportBackupPhraseAction,
  importBackupPhraseFailure,
  importBackupPhraseSuccess,
} from 'src/import/actions'
import { redeemInviteSuccess } from 'src/invite/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { setKey } from 'src/utils/keyStore'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { waitWeb3LastBlock } from 'src/web3/saga'

const TAG = 'import/saga'

export function* importBackupPhraseSaga({ phrase, useEmptyWallet }: ImportBackupPhraseAction) {
  Logger.debug(TAG + '@importBackupPhraseSaga', 'Importing backup phrase')
  yield call(waitWeb3LastBlock)
  try {
    if (!validateMnemonic(phrase, undefined, bip39)) {
      Logger.error(TAG + '@importBackupPhraseSaga', 'Invalid mnemonic')
      yield put(showError(ErrorMessages.INVALID_BACKUP_PHRASE))
      yield put(importBackupPhraseFailure())
      return
    }

    const keys = yield call(generateKeys, phrase, undefined, undefined, bip39)
    const privateKey = keys.privateKey
    if (!privateKey) {
      throw new Error('Failed to convert mnemonic to hex')
    }

    if (!useEmptyWallet) {
      Logger.debug(TAG + '@importBackupPhraseSaga', 'Checking account balance')
      const contractKit = yield call(getContractKit)
      const backupAccount = contractKit.web3.eth.accounts.privateKeyToAccount(
        ensureLeading0x(privateKey)
      ).address

      const dollarBalance: BigNumber = yield call(
        fetchTokenBalanceInWeiWithRetry,
        CURRENCY_ENUM.DOLLAR,
        backupAccount
      )

      // TODO(Rossy) Check gold here too once verificiation is made optional
      if (dollarBalance.isLessThanOrEqualTo(0)) {
        yield put(backupPhraseEmpty())
        navigate(Screens.ImportWalletEmpty, { backupPhrase: phrase })
        return
      }
    }

    const account: string | null = yield call(assignAccountFromPrivateKey, privateKey)
    if (!account) {
      throw new Error('Failed to assign account from private key')
    }

    // Set key in phone's secure store
    yield call(setKey, 'mnemonic', phrase)
    // Set backup complete so user isn't prompted to do backup flow
    yield put(setBackupCompleted())
    // Set redeem invite complete so user isn't brought back into nux flow
    yield put(redeemInviteSuccess())
    yield put(refreshAllBalances())

    navigate(Screens.VerificationEducationScreen)

    yield put(importBackupPhraseSuccess())
  } catch (error) {
    Logger.error(TAG + '@importBackupPhraseSaga', 'Error importing backup phrase', error)
    yield put(showError(ErrorMessages.IMPORT_BACKUP_FAILED))
    yield put(importBackupPhraseFailure())
  }
}

export function* watchImportBackupPhrase() {
  yield takeLeading(Actions.IMPORT_BACKUP_PHRASE, importBackupPhraseSaga)
}

export function* importSaga() {
  yield spawn(watchImportBackupPhrase)
}
