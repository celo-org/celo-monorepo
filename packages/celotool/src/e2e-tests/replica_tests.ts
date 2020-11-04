// tslint:disable: no-console
// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3-celo.d.ts" />
import { DefaultRpcCaller, RpcCaller } from '@celo/contractkit/lib/utils/rpc-caller'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { assert } from 'chai'
import Web3 from 'web3'
import { BlockHeader } from 'web3-eth'
import { privateKeyToPublicKey } from '../lib/generate_utils'
import { getEnodeAddress, initAndStartGeth } from '../lib/geth'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getHooks, sleep, waitForEpochTransition, waitToFinishInstanceSyncing } from './utils'

enum IstanbulManagement {
  getSnapshot = 'istanbul_getSnapshot',
  getValidators = 'istanbul_getValidators',
  getValidatorsBLSPublicKeys = 'istanbul_getValidatorsBLSPublicKeys',
  getProposer = 'istanbul_getProposer',
  addProxy = 'istanbul_addProxy',
  removeProxy = 'istanbul_removeProxy',
  startAtBlock = 'istanbul_startValidatingAtBlock',
  stopAtBlock = 'istanbul_stopValidatingAtBlock',
  startValidating = 'istanbul_startValidating',
  stopValidating = 'istanbul_stopValidating',
  valEnodeTableInfo = 'istanbul_getValEnodeTable',
  versionCertificateTableInfo = 'istanbul_getVersionCertificateTableInfo',
  currentRoundState = 'istanbul_getCurrentRoundState',
  proxies = 'istanbul_getProxiesInfo',
  proxiedValidators = 'istanbul_getProxiedValidators',
  validating = 'istanbul_isValidating',
  replicaState = 'istanbul_getCurrentReplicaState',
}

const TMP_PATH = '/tmp/e2e'
const verbose = false

describe('replica swap tests', () => {
  const gethConfig: GethRunConfig = {
    migrate: false,
    runPath: TMP_PATH,
    verbosity: 4,
    networkId: 1101,
    network: 'local',
    genesisConfig: {
      blockTime: 1,
    },
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
        proxy: 'validator0-proxy0',
        isProxied: true,
        proxyport: 30304,
        proxyAllowPrivateIp: true,
      },
      {
        name: 'validator0-proxy0',
        isProxy: true,
        validating: false,
        syncmode: 'full',
        proxyport: 30304,
        port: 30305,
        rpcport: 8546,
      },
      {
        name: 'validator1',
        validating: true,
        syncmode: 'full',
        port: 30307,
        rpcport: 8547,
      },
      {
        name: 'validator2',
        validating: true,
        syncmode: 'full',
        port: 30309,
        rpcport: 8549,
      },
      {
        name: 'validator3',
        validating: true,
        syncmode: 'full',
        port: 30311,
        wsport: 8544,
        rpcport: 8551,
      },
      {
        name: 'validator4',
        validating: true,
        syncmode: 'full',
        port: 30313,
        rpcport: 8553,
      },
    ],
  }
  const numValidators = gethConfig.instances.filter((x) => x.validating).length

  const hooks: any = getHooks(gethConfig)
  let web3: Web3

  before(async function(this: any) {
    this.timeout(0)
    // Comment out the following line after a local run for a quick rerun.
    await hooks.before()
  })

  after(async function(this: any) {
    this.timeout(0)
    await hooks.after()
  })

  const restart = async () => {
    await hooks.restart()
    web3 = new Web3('http://localhost:8545')
  }

  describe('replica behind single proxy', () => {
    let epoch: number
    let blockCount = 0
    let proxyRPC: RpcCaller
    let validatoRPC: RpcCaller
    let replicaRPC: RpcCaller
    let swapBlock: number
    const missed: any = []

    before(async function(this: any) {
      this.timeout(0) // Disable test timeout

      await restart()

      const proxyPubKey = privateKeyToPublicKey(gethConfig.instances[1].privateKey || '')
      const replica: GethInstanceConfig = {
        name: 'validator0-replica0',
        replica: true,
        validating: true,
        syncmode: 'full',
        port: 30315,
        rpcport: 8555,
        privateKey: gethConfig.instances[0].privateKey,
        proxy: 'validator0-proxy0',
        isProxied: true,
        proxyport: 30304,
        proxyAllowPrivateIp: true,
        proxies: [
          getEnodeAddress(proxyPubKey, '127.0.0.1', 30304),
          getEnodeAddress(proxyPubKey, '127.0.0.1', 30305),
        ],
      }

      await initAndStartGeth(gethConfig, hooks.gethBinaryPath, replica, verbose)
      if (verbose) {
        console.info('Starting sync w/ replica')
      }
      await waitToFinishInstanceSyncing(replica)
      if (verbose) {
        console.info('Replica synced')
      }

      epoch = 20
      // Wait for an epoch transition to ensure everyone is connected to one another.
      await waitForEpochTransition(web3, epoch)

      const validatorWSWeb3Url = 'ws://localhost:8544'
      const validatorWSWeb3 = new Web3(validatorWSWeb3Url)

      validatoRPC = new DefaultRpcCaller(new Web3.providers.HttpProvider('http://localhost:8545'))
      proxyRPC = new DefaultRpcCaller(new Web3.providers.HttpProvider('http://localhost:8546'))
      replicaRPC = new DefaultRpcCaller(new Web3.providers.HttpProvider('http://localhost:8555'))

      const handled: any = {}
      let errorMsg = ''
      let setSwap = false
      const recordNewBlock = async (header: BlockHeader) => {
        try {
          if (handled[header.number]) {
            return
          }
          if (!setSwap) {
            swapBlock = header.number + 40
            if (verbose) {
              console.info(`Swapping validators at block ${swapBlock}`)
            }
            // tslint:disable-next-line: no-shadowed-variable
            let resp = await replicaRPC.call(IstanbulManagement.startAtBlock, [swapBlock])
            assert.equal(resp.error, null)
            resp = await validatoRPC.call(IstanbulManagement.stopAtBlock, [swapBlock])
            assert.equal(resp.error, null)
            setSwap = true
          }
          handled[header.number] = true
          blockCount += 1
          const bitmap = parseBlockExtraData(header.extraData).parentAggregatedSeal.bitmap
          for (let i = 0; i < numValidators; i += 1) {
            if (!bitIsSet(bitmap, i)) {
              missed.push({ idx: i, num: header.number })
            }
          }
        } catch (e) {
          console.error(e)
          errorMsg = e
        }
      }

      // Wait for nodes to reliably sign blocks
      await sleep(2 * epoch)
      const subscription = validatorWSWeb3.eth.subscribe('newBlockHeaders')
      subscription.on('data', recordNewBlock)

      // Wait for a few epochs while rotating a validator.
      while (blockCount < 80) {
        if (verbose) {
          console.info(`Waiting. ${blockCount}/80`)
        }
        await sleep(epoch)
      }
      ;(subscription as any).unsubscribe()
      if (verbose) {
        console.info('Unsubscribed from block headers')
      }

      // Wait for the current epoch to complete.
      await sleep(epoch)
      assert.equal(errorMsg, '')
    })

    it('replica is validating', async () => {
      const validating = (await replicaRPC.call(IstanbulManagement.validating, [])).result as any
      assert.isTrue(validating)
    })

    it('primary is not validating', async () => {
      const validating = (await validatoRPC.call(IstanbulManagement.validating, [])).result as any
      assert.isFalse(validating)
    })

    it('replica should have good val enode table', async () => {
      const resp = (await replicaRPC.call(IstanbulManagement.valEnodeTableInfo, [])).result as any
      Object.keys(resp).forEach((k) => {
        const enode = resp[k].enode
        assert.isTrue((enode || '') !== '')
      })
    })

    it('proxy should be connected', async () => {
      const resp = (await proxyRPC.call(IstanbulManagement.proxiedValidators, []))
        .result as string[][]
      assert.equal(resp.length, 2)
    })

    it('should switch without downtime', async () => {
      if (missed.length !== 0) {
        missed.forEach((x: any) => console.warn(`Validator idx ${x.idx} missed block ${x.num}`))
        console.warn(`Val idx 0 should have switched on block ${swapBlock}`)
      }
      assert.isBelow(missed.length, 4)
    })
  })
})
