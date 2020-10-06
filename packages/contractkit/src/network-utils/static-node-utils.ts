import { GoogleStorageUtils } from './google-storage-utils'

// The bucket where we store static_nodes information for all the networks.
const StaticNodesGoogleStorageBucketName = `static_nodes`

export class StaticNodeUtils {
  static getStaticNodesGoogleStorageBucketName(): string {
    return StaticNodesGoogleStorageBucketName
  }

  /**
   * Fetches the static nodes (as JSON data) from Google Storage.
   * If the network is not working, the method will reject the returned promise
   * along with the response data from Google api.
   * @param networkName Name of the network to fetch config for
   */
  static async getStaticNodesAsync(networkName: string): Promise<string> {
    const bucketName = StaticNodesGoogleStorageBucketName
    const fileName = networkName
    return GoogleStorageUtils.fetchFileFromGoogleStorage(bucketName, fileName)
  }
}
