import NetInfo from '@react-native-community/netinfo'
import auth from '@react-native-firebase/auth'
import storage from '@react-native-firebase/storage'
import * as RNFS from 'react-native-fs'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

const TAG = 'FirebaseLogUploader'

export default class FirebaseLogUploader {
  static async shouldUpload(
    logFilePath: string,
    sizeThreshold: number,
    onlyOnWifi: boolean
  ): Promise<boolean> {
    let statResult: RNFS.StatResult
    try {
      statResult = await RNFS.stat(logFilePath)
    } catch (e) {
      Logger.debug(TAG, `Failed to stat ${logFilePath} Error: ${e}`)
      return false
    }
    const { analyticsEnabled } = store.getState().app
    if (!analyticsEnabled) {
      Logger.debug(TAG, `Analytics is not enabled, should not upload logs`)
      return false
    }

    if (!statResult.isFile || parseInt(statResult.size, 10) < sizeThreshold) {
      Logger.debug(TAG, `/File ${logFilePath} is too small(${statResult.size} bytes) to upload`)
      return false
    }
    if (onlyOnWifi && !(await FirebaseLogUploader.isConnectionWifi())) {
      Logger.debug(TAG, 'Cannot upload, user is not on Wi-Fi')
      return false
    }
    return true
  }

  // First check if shouldUpload returns true and then upload.
  // Note that this method will just move the log file to a temporary file and will finish
  // upload in the background.
  static async upload(
    logFilePath: string,
    uploadPath: string,
    uploadFileName: string
  ): Promise<void> {
    const tmpFilePath = logFilePath + '.tmp'
    await RNFS.moveFile(logFilePath, tmpFilePath)
    // Don't "await" here. While everything else in this async method is relatively fast, data upload can be slow
    // and we don't want to block the user from using the app.
    return FirebaseLogUploader.uploadLogsToFirebaseStorage(tmpFilePath, uploadPath, uploadFileName)
  }

  // Uploaded logs can be seen at
  // https://console.firebase.google.com/project/celo-org-mobile/storage/celo-org-mobile.appspot.com/files~2Flogs~2F
  static async uploadLogsToFirebaseStorage(
    localFilePath: string,
    uploadPath: string,
    uploadFileName: string
  ) {
    try {
      await auth().signInAnonymously()

      const currentDayUTC = new Date().toISOString().slice(0, 10) // example: 2019-05-10

      const fullUploadPath = `logs/${currentDayUTC}/${uploadPath}/${uploadFileName}`
      Logger.debug(TAG, `uploading local log file ${localFilePath} to ${fullUploadPath}`)

      // Note: when this "await" finishes upload might still be pending, so, if the file gets deleted,
      // the upload will fail.
      await storage()
        .ref(fullUploadPath)
        .putFile(localFilePath)

      Logger.debug(
        `${TAG}/uploadLogsToFirebaseStorage`,
        `Firebase logs from file ${uploadFileName} uploaded successfully`
      )
    } catch (e) {
      Logger.error(
        `${TAG}/uploadLogsToFirebaseStorage`,
        `Failed to upload logs from file ${uploadFileName} to Firebase storage: ` + e
      )
    }
  }

  static async isConnectionWifi(): Promise<boolean> {
    const connectionInfo = await NetInfo.fetch()
    const isConnectionExpensive =
      connectionInfo.details && connectionInfo.details.isConnectionExpensive
    Logger.debug(TAG, `isConnectionWifi/Connection type is ${connectionInfo.type}`)
    Logger.debug(TAG, `isConnectionWifi/is connection expensive: ${isConnectionExpensive}`)
    return connectionInfo.type.toString().toLowerCase() === 'wifi' && !isConnectionExpensive
  }
}
