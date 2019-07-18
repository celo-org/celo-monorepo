import { NETWORK_NAME } from '../contracts/network-name'
import { Logger, LogLevel } from '../src/logger'
import { getIpAddressOfTxnNode } from './utils'

describe('Google Storage utils', () => {
  describe('#getStaticNodesAsync', () => {
    it('should be able to get static nodes IP address', async () => {
      Logger.setLogLevel(LogLevel.VERBOSE)
      const ipAddress = await getIpAddressOfTxnNode(NETWORK_NAME)
      Logger.debug('Google Storage utils', `IP address is ${ipAddress}`)
      // A small check to ensure that we have received a non-empty IP address
      // The smallest IPv4 IP will can see will be [0-9].[0-9].[0-9].[0-9] which is 7 digits.
      if (ipAddress === null) {
        fail(`IP address for ${NETWORK_NAME} is null`)
      } else {
        expect(ipAddress.length).toBeGreaterThan(7)
      }
    })
  })
})
