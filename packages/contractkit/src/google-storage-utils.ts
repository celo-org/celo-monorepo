import fetch from 'cross-fetch'
import { Logger } from './logger'

const TAG = 'google-storage-utils'

export default class GoogleStorageUtils {
  static async fetchFileFromGoogleStorage(bucketName: string, fileName: string): Promise<string> {
    Logger.debug(
      `google-storage-utils@fetchFileFromGoogleStorage`,
      `Downloading file ${fileName} from ${bucketName}...`
    )
    const url = GoogleStorageUtils.constructGoogleStorageUrl(bucketName, fileName)
    let response: Response | null = null
    try {
      response = await fetch(url)
    } catch (error) {
      Logger.info(
        `google-storage-utils@fetchFileFromGoogleStorage`,
        `${TAG} Fetch failed with error "${error}"`
      )
      throw error
    }
    Logger.debug(
      `google-storage-utils@fetchFileFromGoogleStorage`,
      `${TAG} response for ${url} is ${JSON.stringify(response)}`
    )

    if (response.status >= 400) {
      Logger.debug(`google-storage-utils@fetchFileFromGoogleStorage`, `Failed to fetch data`)
      throw new Error(await response.text())
    } else {
      Logger.debug(`google-storage-utils@fetchFileFromGoogleStorage`, `Successfully fetched data`)
      return response.text()
    }
  }

  // Source: https://cloud.google.com/storage/docs/json_api/
  private static constructGoogleStorageUrl(bucketName: string, fileName: string): string {
    return `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${fileName}?alt=media`
  }
}
