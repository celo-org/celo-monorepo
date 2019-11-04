export enum Actions {
  IMPORT_BACKUP_PHRASE = 'IMPORT/IMPORT_BACKUP_PHRASE',
  IMPORT_BACKUP_PHRASE_SUCCESS = 'IMPORT/IMPORT_BACKUP_PHRASE_SUCCESS',
  IMPORT_BACKUP_PHRASE_FAILURE = 'IMPORT/IMPORT_BACKUP_PHRASE_FAILURE',
  BACKUP_PHRASE_EMPTY = 'IMPORT/BACKUP_PHRASE_EMPTY',
}

export interface ImportBackupPhraseAction {
  type: Actions.IMPORT_BACKUP_PHRASE
  phrase: string
  useEmptyWallet: boolean
}

export const importBackupPhrase = (
  phrase: string,
  useEmptyWallet: boolean
): ImportBackupPhraseAction => ({
  type: Actions.IMPORT_BACKUP_PHRASE,
  phrase,
  useEmptyWallet,
})

export interface ImportBackupPhraseSuccessAction {
  type: Actions.IMPORT_BACKUP_PHRASE_SUCCESS
}

export const importBackupPhraseSuccess = (): ImportBackupPhraseSuccessAction => ({
  type: Actions.IMPORT_BACKUP_PHRASE_SUCCESS,
})

export interface ImportBackupPhraseFailureAction {
  type: Actions.IMPORT_BACKUP_PHRASE_FAILURE
}

export const importBackupPhraseFailure = (): ImportBackupPhraseFailureAction => ({
  type: Actions.IMPORT_BACKUP_PHRASE_FAILURE,
})

export interface BackupPhraseEmptyAction {
  type: Actions.BACKUP_PHRASE_EMPTY
}

export const backupPhraseEmpty = (): BackupPhraseEmptyAction => ({
  type: Actions.BACKUP_PHRASE_EMPTY,
})

export type ActionTypes =
  | ImportBackupPhraseAction
  | ImportBackupPhraseSuccessAction
  | ImportBackupPhraseFailureAction
  | BackupPhraseEmptyAction
