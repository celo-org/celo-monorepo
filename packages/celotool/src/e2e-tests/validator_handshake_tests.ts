import { eqAddress } from '@celo/utils/lib/address'
import { assert } from 'chai'
import _ from 'lodash'
import sleep from 'sleep-promise'
import Web3 from 'web3'
import { Admin } from 'web3-eth-admin'
// import { restoreDatadir, startGeth } from '../lib/geth'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import {
  /*getGethBinaryPath,*/ getContext,
  jsonRpc,
  restartInstanceWithNewNodeKey /*, killInstance */,
} from './utils'

const VALIDATORS = 3
const PROXIED_VALIDATORS = 1
const EPOCH = 20

const TMP_PATH = '/tmp/e2e'

describe('governance tests', () => {
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
  let web3: Web3

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(context.hooks.after)

  describe('Validator handshake', () => {
    before(async function() {
      this.timeout(0)
      web3 = new Web3('http://localhost:8545')
      await context.hooks.restart()
    })

    it('allows a validator with a new enode to identify itself to a newly peered validator', async function(this: any) {
      this.timeout(20000 /* 20 seconds */)
      // If a consensus round fails during this test, the results are inconclusive.
      // Retry up to two times to mitigate this issue. Restarting the nodes is not needed.
      // this.retries(2)

      const val0Provider = `http://localhost:${gethConfig.instances[0].rpcport}`
      const val1Provider = `http://localhost:${gethConfig.instances[1].rpcport}`

      const val0Admin = new Admin(val0Provider)

      const val1Web3 = new Web3(val1Provider)
      const val1Admin = new Admin(val1Provider)

      const val0InfoBefore = await val0Admin.getNodeInfo()
      const val0EnodeBefore = val0InfoBefore.enode

      // const val1ValEnodeBefore = await jsonRpc(val1Web3, 'istanbul_getValEnodeTable', [])

      console.log('Yes restarting!!!')
      // restart the instance, which will give it a random nodekey
      await restartInstanceWithNewNodeKey(gethConfig, gethConfig.instances[0])
      // await sleep(10000)
      console.log('Yes resuming!!!')

      const val0InfoAfter = await val0Admin.getNodeInfo()
      const val0EnodeAfter = val0InfoAfter.enode

      console.log('before', val0EnodeBefore)
      console.log('after', val0EnodeAfter)

      assert(
        !_.isEqual(val0EnodeBefore, val0EnodeAfter),
        'Restarting instance 0 with a new nodekey did not result in a new enode'
      )

      // Validator 0 adds validator 1 as a peer, validator 1 should immediately
      // have it as a ValidatorPurpose peer
      const val1Info = await val1Admin.getNodeInfo()
      const val1Enode = val1Info.enode

      await val0Admin.addPeer(val1Enode)
      await sleep(1000)

      const val1Peers = await val1Admin.getPeers()
      // We compare the enodeUrl without the port because sometimes the
      // peer.enode gives the port of the remoteAddress, not the localAddress
      const val0EnodeNoPort = getEnodeNoPort(val0EnodeAfter)

      let foundVal0 = false
      for (const peer of val1Peers) {
        console.log('peer', peer)
        // @ts-ignore enode is not in the expected type, but will be given by the RPC
        const peerEnodeNoPort = getEnodeNoPort(peer.enode)
        if (peerEnodeNoPort === val0EnodeNoPort) {
          const validatorPurpose = 'ValidatorPurpose'
          // @ts-ignore staticNodeInfo and trustedNodeInfo are not in the type definition
          assert(
            peer.staticNodeInfo.includes(validatorPurpose) &&
              peer.trustedNodeInfo.includes(validatorPurpose),
            'Validator 0 is not a validator peer to validator 1'
          )
          foundVal0 = true
          break
        }
      }

      assert(foundVal0, 'Validator 0 did not peer with validator 1 after being restarted')

      const val1ValEnodeTable = (await jsonRpc(val1Web3, 'istanbul_getValEnodeTable', [])).result
      const val0Address = await web3.eth.getCoinbase()

      console.log('val0Address', val0Address)
      console.log('val1ValEnodeTable', val1ValEnodeTable)
      console.log('val1ValEnodeTable[val0Address]', val1ValEnodeTable[val0Address])
      console.log('val0EnodeAfter', val0EnodeAfter)

      let foundEntry = false
      for (const [valAddr, entry] of Object.entries(val1ValEnodeTable)) {
        console.log('comparing', valAddr, val0Address, eqAddress(valAddr, val0Address), entry)
        // valAddr is checksummed and we need to compare it to the non-checksummed
        // address `val0Address`
        if (eqAddress(valAddr, val0Address)) {
          // @ts-ignore
          assert(
            entry.enode === val0EnodeAfter,
            "Enode for validator 0 in validator 1's valEnodeTable is incorrect"
          )
          foundEntry = true
          break
        }
      }

      assert(
        foundEntry,
        `Did not find validator 0's address ${val0Address} in validator 1's valEnodeTable`
      )

      // await jsonRpc(web3, 'admin_peers', [])

      // // Kill one instance
      // const instance = gethConfig.instances[0]
      // await killInstance(instance)
      //
      // await restoreDatadir(gethConfig.runPath, instance)
      // if (!instance.privateKey && instance.validating) {
      //   instance.privateKey = validatorPrivateKeys[validatorIndices[i]]
      // }
      // return startGeth(gethConfig, gethBinaryPath, instance, verbose)
    })

    it.only('allows a new proxy to identify itself on behalf of its validator to a newly peered validator', async function(this: any) {
      this.timeout(2000000 /* 200 seconds */)
      // If a consensus round fails during this test, the results are inconclusive.
      // Retry up to two times to mitigate this issue. Restarting the nodes is not needed.
      // this.retries(2)

      const proxiedValIndex = VALIDATORS - PROXIED_VALIDATORS
      const proxiedValProvider = `http://localhost:${gethConfig.instances[proxiedValIndex].rpcport}`
      const proxiedValWeb3 = new Web3(proxiedValProvider)
      const proxiedValAdmin = new Admin(proxiedValProvider)
      console.log(proxiedValWeb3)

      const proxyIndex = VALIDATORS - PROXIED_VALIDATORS + 1
      const proxyProvider = `http://localhost:${gethConfig.instances[proxyIndex].rpcport}`
      const proxyWeb3 = new Web3(proxyProvider)
      const proxyAdmin = new Admin(proxyProvider)
      console.log(proxyWeb3)

      const proxyEnodeNoPort = getEnodeNoPort((await proxyAdmin.getNodeInfo()).enode)

      console.log('proxyEnodeNoPort', proxyEnodeNoPort)

      console.log('yo peeeers before', await proxiedValAdmin.getPeers())

      // TODO - change this to removing/adding a proxy once the RPCs are in a better state
      const newGethConfig = Object.assign({}, gethConfig)
      newGethConfig.instances[proxyIndex].privateKey =
        '26ad9dc2a8adcacdf3427e185ea358ba80aa3f205c8b7766acb16cd2beb1492a'
      await restartInstanceWithNewNodeKey(newGethConfig, newGethConfig.instances[proxyIndex])
      await restartInstanceWithNewNodeKey(newGethConfig, newGethConfig.instances[proxiedValIndex])

      await sleep(10000)

      console.log('yo peeeers after', await proxiedValAdmin.getPeers())

      await sleep(1000000)
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
    setNodeKey: false,
  }))

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
      setNodeKey: false,
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
      setNodeKey: true,
    })
  }
  return instances
}

function getEnodeNoPort(fullEnode: string) {
  return fullEnode
    .split(':')
    .slice(0, 2)
    .join(':')
}
