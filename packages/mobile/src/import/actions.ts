export enum Actions {
  IMPORT_BACKUP_PHRASE = 'IMPORT/IMPORT_BACKUP_PHRASE',
  IMPORT_BACKUP_PHRASE_SUCCESS = 'IMPORT/IMPORT_BACKUP_PHRASE_SUCCESS',
  IMPORT_BACKUP_PHRASE_FAILURE = 'IMPORT/IMPORT_BACKUP_PHRASE_FAILURE',
  IMPORT_BACKUP_PHRASE_EMPTY = 'IMPORT/IMPORT_BACKUP_PHRASE_EMPTY',
  TRY_ANOTHER_BACKUP_PHRASE = 'IMPORT/TRY_ANOTHER_BACKUP_PHRASE',
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

export interface ImportBackupPhraseEmptyAction {
  type: Actions.IMPORT_BACKUP_PHRASE_EMPTY
}

export const importBackupPhraseEmpty = (): ImportBackupPhraseEmptyAction => ({
  type: Actions.IMPORT_BACKUP_PHRASE_EMPTY,
})

export interface TryAnotherBackupPhraseAction {
  type: Actions.TRY_ANOTHER_BACKUP_PHRASE
}

export const tryAnotherBackupPhrase = (): TryAnotherBackupPhraseAction => ({
  type: Actions.TRY_ANOTHER_BACKUP_PHRASE,
})

export type ActionTypes =
  | ImportBackupPhraseAction
  | ImportBackupPhraseSuccessAction
  | ImportBackupPhraseFailureAction
  | ImportBackupPhraseEmptyAction
  | TryAnotherBackupPhraseAction
