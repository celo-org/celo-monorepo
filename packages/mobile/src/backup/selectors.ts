import { DAYS_TO_BACKUP } from 'src/backup/utils'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getRemoteTime, ONE_DAY_IN_MILLIS } from 'src/utils/time'

export const shouldForceBackupSelector = (state: RootState) => {
  if (state.account.backupCompleted) {
    return false
  }
  const time = getRemoteTime()
  if (time < state.account.accountCreationTime + DAYS_TO_BACKUP * ONE_DAY_IN_MILLIS) {
    return false
  }
  // If user didn't press the 'Wait One Hour' button yet, force backup with button visible.
  if (!state.account.backupRequiredTime) {
    return true
  }
  return time > state.account.backupRequiredTime
}

const accountKeyScreens: string[] = [
  Screens.BackupIntroduction,
  Screens.AccountKeyEducation,
  Screens.PincodeEnter,
  Screens.BackupPhrase,
  Screens.BackupQuiz,
]

export const doingBackupFlowSelector = (state: RootState) => {
  return accountKeyScreens.indexOf(state.app.activeScreen) >= 0
}
