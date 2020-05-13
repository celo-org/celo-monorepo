import { jsonRpc } from '@celo/protocol/lib/test-utils'
import { eqAddress } from '@celo/utils/lib/address'
import { assert } from 'chai'
import _ from 'lodash'
import Web3 from 'web3'
import { Admin } from 'web3-eth-admin'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getContext, killInstance, restartInstance, setProxyConfigurations, sleep } from './utils'

const VALIDATORS = 3
const PROXIED_VALIDATORS = 1
const EPOCH = 20

const TMP_PATH = '/tmp/e2e'

describe('Validator handshake tests', () => {
  const gethConfig: GethRunConfig = {
    networkId: 1101,
    network: 'local',
    runPath: TMP_PATH,
    migrate: false,
    instances: getInstances(),
    genesisConfig: {
      epoch: EPOCH,
    },
  }
  const context: any = getContext(gethConfig)

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(context.hooks.after)

  describe('Validator handshake', () => {
    beforeEach(async function() {
      // Because these tests are modifying the gethConfig (like the proxy
      // configuration, or maxpeers), we reset the instances and the proxy
      // configurations for each test
      gethConfig.instances = getInstances()
      setProxyConfigurations(gethConfig)
      this.timeout(0)
      await context.hooks.restart()
    })

    it('allows a validator with a new enode to identify itself to a newly peered validator whose maxpeers is 0', async function(this: any) {
      this.timeout(20000) // 20 seconds
      // If a consensus round fails during this test, the results are inconclusive.
      // Retry up to two times to mitigate this issue. Restarting the nodes is not needed.
      this.retries(2)

      const val0Provider = getProvider(gethConfig.instances, 'validator0')
      assert(val0Provider, 'Could not find validator 0 provider')
      const val0Web3 = new Web3(val0Provider)
      const val0Admin = new Admin(val0Provider)
      const val0InfoBefore = await val0Admin.getNodeInfo()
      const val0EnodeBefore = val0InfoBefore.enode

      const val1Provider = getProvider(gethConfig.instances, 'validator1')
      assert(val1Provider, 'Could not find validator 1 provider')
      const val1Web3 = new Web3(val1Provider)
      const val1Admin = new Admin(val1Provider)
      const val1Address = await val1Web3.eth.getCoinbase()

      // restart instance 1 with maxPeers as 0
      gethConfig.instances[1].maxPeers = 0
      await restartInstance(gethConfig, gethConfig.instances[1])

      // restart validator 0, and give it a new random nodekey
      await restartInstance(gethConfig, gethConfig.instances[0], true)

      const val0InfoAfter = await val0Admin.getNodeInfo()
      const val0EnodeAfter = val0InfoAfter.enode

      assert(
        !_.isEqual(val0EnodeBefore, val0EnodeAfter),
        'Restarting instance 0 with a new nodekey did not result in a new enode'
      )

      // Ensure that the restarted validator 0 still has its valEnodeTable and
      // has the correct entry for validator 1
      const val1Info = await val1Admin.getNodeInfo()
      const val1EnodeNoPort = getEnodeNoPort(val1Info.enode)
      const val0ValEnodeTable = await jsonRpc(val0Web3, 'istanbul_getValEnodeTable', [])
      const val1EntryInVal0ValEnodeTable = getValEnodeTableEntry(val0ValEnodeTable, val1Address)
      assert(
        val1EntryInVal0ValEnodeTable,
        `Did not find an entry for validator 1's address ${val1Address}`
      )
      assert(
        // @ts-ignore enode is not in the type definition
        getEnodeNoPort(val1EntryInVal0ValEnodeTable.enode) === val1EnodeNoPort,
        "Enode for validator 1 in validator 0's valEnodeTable is incorrect"
      )

      // validator 0 still has its valEnodeTable, so it will try to connect to
      // validator 1 immediately. It should identify itself as a validator and
      // immediately be accepted as a ValidatorPurpose peer by validator 1
      const val1Peers = await val1Admin.getPeers()
      // We compare the enodeUrl without the port because sometimes the
      // peer.enode gives the port of the remoteAddress, not the localAddress
      const val0EnodeNoPort = getEnodeNoPort(val0EnodeAfter)
      assert(
        isValidatorPeer(val1Peers, val0EnodeNoPort),
        'Validator 0 is not a ValidatorPurpose peer with validator 1 after being restarted'
      )
      // Verify that the peering was initiated by validator 0
      const val0Peer = getPeer(val1Peers, val0EnodeNoPort)
      assert(val0Peer, "Could not find validator 0 in validator 1's peers")
      assert(val0Peer.network.inbound, 'Validator 0 peer to validator 1 is not inbound')

      const val1ValEnodeTable = await jsonRpc(val1Web3, 'istanbul_getValEnodeTable', [])
      const val0Address = await val0Web3.eth.getCoinbase()

      const entry = getValEnodeTableEntry(val1ValEnodeTable, val0Address)
      assert(entry, `Did not find an entry for validator 0's address ${val0Address}`)
      assert(
        // @ts-ignore enode is not in the type definition
        getEnodeNoPort(entry.enode) === val0EnodeNoPort,
        "Enode for validator 0 in validator 1's valEnodeTable is incorrect"
      )
    })

    it('allows a new proxy to identify itself on behalf of its validator to a newly peered validator whose maxpeers is 0', async function(this: any) {
      this.timeout(100000) // 100 seconds
      // If a consensus round fails during this test, the results are inconclusive.
      // Retry up to two times to mitigate this issue. Restarting the nodes is not needed.
      this.retries(2)

      const proxiedValIndex = VALIDATORS - PROXIED_VALIDATORS
      const proxiedValProvider = getProvider(gethConfig.instances, `validator${proxiedValIndex}`)
      assert(proxiedValProvider, 'Could not find proxied validator provider')
      const proxiedValWeb3 = new Web3(proxiedValProvider)
      const proxiedValAddress = await proxiedValWeb3.eth.getCoinbase()

      const proxyIndex = VALIDATORS - PROXIED_VALIDATORS + 1
      const proxyProvider = getProvider(gethConfig.instances, `proxy${proxiedValIndex}`)
      assert(proxyProvider, 'Could not find proxy provider')
      const proxyAdmin = new Admin(proxyProvider)

      const val0Provider = getProvider(gethConfig.instances, `validator0`)
      assert(val0Provider, 'Could not find validator 0 provider')
      const val0Admin = new Admin(val0Provider)
      const val0Web3 = new Web3(val0Provider)

      // TODO - change this to removing/adding a proxy once the RPCs are in a better state
      gethConfig.instances[proxyIndex].privateKey =
        '26ad9dc2a8adcacdf3427e185ea358ba80aa3f205c8b7766acb16cd2beb1492a'
      gethConfig.instances[0].maxPeers = 0
      setProxyConfigurations(gethConfig)

      // Stop validator 1 so it cannot share the new proxy enode via the normal announce protocol.
      // This leaves us with only validator 0, the proxied validator, and the proxy
      await killInstance(gethConfig.instances[1])

      // Restart validator 0 to have a max peers of 0.
      // It will still have its valEnodeTable, which will still have the old entry
      // for the proxied validator
      await restartInstance(gethConfig, gethConfig.instances[0])
      let val0ValEnodeTable = await jsonRpc(val0Web3, 'istanbul_getValEnodeTable', [])
      let val0ProxiedValEntry = getValEnodeTableEntry(val0ValEnodeTable, proxiedValAddress)
      assert(val0ProxiedValEntry, 'No entry in restarted validator 0 for old proxied validator')

      // Restart the proxy with the new privateKey to force a new enode.
      // The proxied validator will not connect to the new proxy because of the
      // incorrect enode, so at this point the proxy does not have any proof
      // it is on behalf of the proxied validator.
      await restartInstance(gethConfig, gethConfig.instances[proxyIndex])
      val0ValEnodeTable = await jsonRpc(val0Web3, 'istanbul_getValEnodeTable', [])
      const val0ProxiedValEntryOld = val0ProxiedValEntry
      val0ProxiedValEntry = getValEnodeTableEntry(val0ValEnodeTable, proxiedValAddress)
      assert(
        val0ProxiedValEntry,
        'No entry in restarted validator 0 for proxied validator after restarting the proxy'
      )

      assert(
        // @ts-ignore
        val0ProxiedValEntryOld.enode === val0ProxiedValEntry.enode,
        'Proxied validator enode entry in validator 0 has changed'
      )

      // Restart the proxied validator to connect to the new proxy
      await restartInstance(gethConfig, gethConfig.instances[proxiedValIndex], true)

      // Give the proxy 30 seconds to connect to validator 0.
      // This extra amount of time is needed because the proxy will have already
      // tried to connect to validator 0 at start up, but been rejected because
      // the proxy was not connected to its proxied validator. This 30 seconds
      // waits for the proxy to retry connecting to proxy 0.
      await sleep(30)

      const val0Peers = await val0Admin.getPeers()
      const proxyEnodeNoPort = getEnodeNoPort((await proxyAdmin.getNodeInfo()).enode)
      assert(
        isValidatorPeer(val0Peers, proxyEnodeNoPort),
        'Proxy is not a validator peer of validator 0'
      )

      // Verify that the peering was initiated by the proxy and used the handshake
      const proxyPeer = getPeer(val0Peers, proxyEnodeNoPort)
      assert(proxyPeer, "Could not find proxy in validator 0's peers")
      assert(proxyPeer.network.inbound, 'Proxy peer to validator 0 is not inbound')
    })
  })
})

function getInstances() {
  const instances: GethInstanceConfig[] = _.range(VALIDATORS - PROXIED_VALIDATORS).map((i) => ({
    name: `validator${i}`,
    validating: true,
    syncmode: 'full',
    port: 30303 + 3 * i,
    rpcport: 8545 + 2 * i,
    lightserv: false,
  }))
  // Create the last PROXIED_VALIDATORS validators with their own proxies
  for (let i = VALIDATORS - PROXIED_VALIDATORS; i < VALIDATORS; i++) {
    instances.push({
      name: `validator${i}`,
      validating: true,
      syncmode: 'full',
      port: 30303 + 3 * i,
      rpcport: 8545 + 2 * i,
      lightserv: false,
      proxy: `proxy${i}`,
      isProxied: true,
    })
    instances.push({
      name: `proxy${i}`,
      validating: false,
      syncmode: 'full',
      port: 30303 + 3 * i + 1,
      proxyport: 30303 + 3 * i + 2,
      rpcport: 8545 + 2 * i + 1,
      lightserv: false,
      isProxy: true,
    })
  }
  return instances
}

function getProvider(instances: GethInstanceConfig[], targetName: string) {
  for (const instance of instances) {
    if (instance.name === targetName && instance.rpcport) {
      return `http://localhost:${instance.rpcport}`
    }
  }
  return ''
}

function getEnodeNoPort(fullEnode: string) {
  return fullEnode
    .split(':')
    .slice(0, 2)
    .join(':')
}

function getValEnodeTableEntry(valEnodeTable: any, targetAddress: string) {
  for (const [valAddr, entry] of Object.entries(valEnodeTable)) {
    // valAddr is checksummed and we need to compare it to the non-checksummed
    // address targetAddress
    if (eqAddress(valAddr, targetAddress)) {
      return entry
    }
  }
  return null
}

function getPeer(peers: any[], targetEnodeNoPort: string) {
  for (const peer of peers) {
    // @ts-ignore enode is not in the expected type, but will be given by the RPC
    const peerEnodeNoPort = getEnodeNoPort(peer.enode)
    if (peerEnodeNoPort === targetEnodeNoPort) {
      return peer
    }
  }
  return null
}

function isValidatorPeer(peers: any[], targetEnodeNoPort: string) {
  const peer = getPeer(peers, targetEnodeNoPort)
  const validatorPurpose = 'ValidatorPurpose'
  return (
    peer &&
    // @ts-ignore staticNodeInfo is not in the type definition
    peer.staticNodeInfo.includes(validatorPurpose) &&
    // @ts-ignore trustedNodeInfo is not in the type definition
    peer.trustedNodeInfo.includes(validatorPurpose)
  )
}
