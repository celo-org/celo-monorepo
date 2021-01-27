import debugFactory from 'debug'
import { GoogleStorageUtils } from './google-storage-utils'
import { Coordinates, timezone } from './utils/timezone'

const debug = debugFactory('network-utils:static-node-utils')

// The bucket where we store static_nodes information for all the networks.
const StaticNodesGoogleStorageBucketName = `static_nodes`

interface Range {
  min: number
  max: number
}

// Represents a region as a box, specified in degrees of latitude and longitude.
interface Region {
  name: string
  latitude?: Range
  longitude?: Range
}

/**
 * Checks whether the given coordinates are in the given region.
 * @remarks Latitudes are assumed to be normalized to the range [-90, 90],
 * and longitudes to the range [-180, 180].
 */
function inRegion(coords: Coordinates, region: Region): boolean {
  // Check that x in is the range, wrapping if range min is greater than the max.
  const rangeCheck = (x: number, range: Range | undefined) =>
    range === undefined ||
    (range.min <= range.max ? range.min <= x && x < range.max : range.min <= x || x < range.max)

  return (
    rangeCheck(coords.latitude, region.latitude) && rangeCheck(coords.longitude, region.longitude)
  )
}

/**
 * Region names for groups of static nodes deployed around the world for each network.
 * Used as a suffix to the blob name when fetching to get region specific nodes.
 */
const mainnetRegions = [
  {
    name: 'gcp-asia-east1',
    longitude: { min: 60, max: -170 },
  },
  {
    name: 'gcp-europe-west1',
    longitude: { min: -25, max: 60 },
  },
  {
    name: 'gcp-southamerica-east1',
    latitude: { min: -90, max: 0 },
    longitude: { min: -170, max: -25 },
  },
  {
    name: 'gcp-us-east1',
    latitude: { min: 0, max: 90 },
    longitude: { min: -105, max: -25 },
  },
  {
    name: 'gcp-us-west1',
    latitude: { min: 0, max: 90 },
    longitude: { min: -170, max: -105 },
  },
]
const StaticNodeRegions: { [network: string]: Region[] } = {
  mainnet: mainnetRegions,
  // Alias for mainnet
  rc1: mainnetRegions,
}

export class StaticNodeUtils {
  static getStaticNodesGoogleStorageBucketName(): string {
    return StaticNodesGoogleStorageBucketName
  }

  /**
   * Resolves the best region to use for static node connections.
   * @param networkName Name of the network to get a region for.
   * @remarks This method currently uses the interpreter's timezone and the
   * IANA timezone database to establish what region of the world the client is
   * in, then map that to a static list of static node clusters run by cLabs.
   * If the timezone is not set according to the user's location, this method
   * may route them to suboptimal set of static nodes. The resolution method
   * may be replaced in the future.
   */
  static getStaticNodeRegion(networkName: string, tz?: string): string {
    // Get the latitude and longitude of the timezone locations.
    // Note: This is the location of the city that the user has the timzone set to.
    const tzInfo = timezone(tz)
    const coords = tzInfo?.coordinates
    if (coords === undefined) {
      debug('Could not resolve region from timezone %s', tzInfo?.name)
      return '' // Use the default region of static nodes
    }
    const regions = StaticNodeRegions[networkName] ?? []
    const result = regions.find((region) => inRegion(coords, region))?.name ?? ''
    debug('Resolved region %q from timezone %s', result, tzInfo?.name)
    return result
  }

  /**
   * Fetches the static nodes (as JSON data) from Google Storage corresponding
   * to the best available region for this caller.
   * If the network is not working, the method will reject the returned promise
   * along with the response data from Google API.
   * @param networkName Name of the network to fetch config for
   */
  static getRegionalStaticNodesAsync(networkName: string, region?: string): Promise<string> {
    const resolvedRegion = region ?? this.getStaticNodeRegion(networkName)
    const bucketName = StaticNodesGoogleStorageBucketName
    const fileName = resolvedRegion ? `${networkName}.${resolvedRegion}` : networkName
    return GoogleStorageUtils.fetchFileFromGoogleStorage(bucketName, fileName)
  }

  /**
   * Fetches the static nodes (as JSON data) from Google Storage.
   * If the network is not working, the method will reject the returned promise
   * along with the response data from Google API.
   * @param networkName Name of the network to fetch config for
   */
  static async getStaticNodesAsync(networkName: string): Promise<string> {
    return this.getRegionalStaticNodesAsync(networkName, '')
  }
}
