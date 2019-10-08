import Contacts from 'react-native-contacts'

export async function requestPhoneStatePermission() {
  throw new Error('Unimplemented method')
  return false
}

export async function requestContactsPermission(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    Contacts.requestPermission((err, permission) => {
      if (err) {
        reject(err)
      } else {
        resolve(permission === 'authorized')
      }
    })
  })
}

export async function requestCameraPermission() {
  throw new Error('Unimplemented method')
  return false
}

export async function checkContactsPermission(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    Contacts.checkPermission((err, permission) => {
      if (err) {
        reject(err)
      } else {
        resolve(permission === 'authorized')
      }
    })
  })
}

export async function checkCameraPermission() {
  throw new Error('Unimplemented method')
  return false
}
