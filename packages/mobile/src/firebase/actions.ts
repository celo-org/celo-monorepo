export enum Actions {
  AUTHORIZED = 'FIREBASE/AUTHORIZED',
}

export interface FirebaseAuthorizedAction {
  type: Actions.AUTHORIZED
}

export const firebaseAuthorized = (): FirebaseAuthorizedAction => ({
  type: Actions.AUTHORIZED,
})
