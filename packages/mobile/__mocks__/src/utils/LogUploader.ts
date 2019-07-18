const MockFirebaseLogUploader = 'Mock FirebaseLogUploader'
export default class FirebaseLogUploader {
  static async shouldUpload(logFilePath: string, sizeThreshold: number, onlyOnWifi: boolean) {
    console.log(MockFirebaseLogUploader, ': ShouldUpload return True')
    return true
  }

  static async upload(logFilePath: string, uploadPath: string, uploadFileName: string) {
    console.log(MockFirebaseLogUploader, ': Upload running')
  }
  static async uploadLogsToFirebaseStorage(
    localFilePath: string,
    uploadPath: string,
    uploadFileName: string
  ) {
    console.log(MockFirebaseLogUploader, ': UploadLogsToFirebaseStorage running')
  }

  static async isConnectionWifi() {
    console.log(MockFirebaseLogUploader, ': IsConnectionWifi running')
  }
}
