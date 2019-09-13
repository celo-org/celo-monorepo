import { NETWORK_NAME } from '../contracts/network-name'
import GoogleStorageUtils from './google-storage-utils'
import { Logger } from './logger'

// The bucket where we store bootnode information for all the networks.
const BootnodesGoogleStorageBucketName = `bootnodes`

export default class BootnodeUtils {
  static getBootnodesGoogleStorageBucketName(): string {
    return BootnodesGoogleStorageBucketName
  }

  /**
   * Fetches the bootnodes (as JSON data) from Google Storage.
   * If the network is not working, the method will reject the returned promise
   * along with the response data from Google api.
   * @param networkName Name of the network to fetch bootnodes for
   */
  static async getBootnodesAsync(networkName: string): Promise<string> {
    if (networkName !== NETWORK_NAME) {
      Logger.error(
        'getBootnodesAsync',
        `SDK was built for ${NETWORK_NAME} while the caller is requesting enodes of ${networkName}`
      )
    }
    const bucketName = BootnodesGoogleStorageBucketName
    const fileName = networkName
    return GoogleStorageUtils.fetchFileFromGoogleStorage(bucketName, fileName)
  }
}
