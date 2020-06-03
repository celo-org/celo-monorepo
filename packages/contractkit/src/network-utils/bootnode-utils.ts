import { GoogleStorageUtils } from './google-storage-utils'

// The bucket where we store static_nodes information for all the networks.
const BootnodesGoogleStorageBucketName = `env_bootnodes`

export class BootnodeUtils {
  static getBootnodesGoogleStorageBucketName(): string {
    return BootnodesGoogleStorageBucketName
  }

  /**
   * Fetches the static nodes (as JSON data) from Google Storage.
   * If the network is not working, the method will reject the returned promise
   * along with the response data from Google api.
   * @param networkName Name of the network to fetch config for
   */
  static getBootnodesAsync(networkName: string): Promise<string> {
    const bucketName = BootnodesGoogleStorageBucketName
    const fileName = networkName
    return GoogleStorageUtils.fetchFileFromGoogleStorage(bucketName, fileName)
  }
}
