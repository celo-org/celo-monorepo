// @ts-ignore *
// tslint:disable: no-console
// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3-celo.d.ts" />
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { eqAddress, privateKeyToAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { getBlsPoP, getBlsPublicKey } from '@celo/utils/lib/bls'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import path from 'path'
import Web3 from 'web3'
import { BlockHeader } from 'web3-eth'
import {
  AccountType,
  generateGenesis,
  generatePrivateKey,
  privateKeyToPublicKey,
  Validator,
} from '../lib/generate_utils'
import {
  connectPeers,
  connectValidatorPeers,
  getEnodeAddress,
  importGenesis,
  initAndStartGeth,
  addProxyPeer,
} from '../lib/geth'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import {
  assertAlmostEqual,
  getHooks,
  sleep,
  waitForBlock,
  waitForEpochTransition,
  waitToFinishInstanceSyncing,
} from './utils'
import { exit } from 'yargs'
// import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul

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

interface MemberSwapper {
  swap(): Promise<void>
}

const TMP_PATH = '/tmp/e2e'
const verbose = false
const carbonOffsettingPartnerAddress = '0x1234567812345678123456781234567812345678'

async function newMemberSwapper(kit: ContractKit, members: string[]): Promise<MemberSwapper> {
  let index = 0
  const group = (await kit.web3.eth.getAccounts())[0]
  await Promise.all(members.slice(1).map((member) => removeMember(member)))

  async function removeMember(member: string) {
    return (await kit.contracts.getValidators())
      .removeMember(member)
      .sendAndWaitForReceipt({ from: group })
  }

  async function addMember(member: string) {
    return (
      await (await kit.contracts.getValidators()).addMember(group, member)
    ).sendAndWaitForReceipt({ from: group })
  }

  async function getGroupMembers() {
    const groupInfo = await (await kit._web3Contracts.getValidators()).methods
      .getValidatorGroup(group)
      .call()
    return groupInfo[0]
  }

  return {
    async swap() {
      const removedMember = members[index % members.length]
      await removeMember(members[index % members.length])
      index = index + 1
      const addedMember = members[index % members.length]
      await addMember(members[index % members.length])
      const groupMembers = await getGroupMembers()
      assert.include(groupMembers, addedMember)
      assert.notInclude(groupMembers, removedMember)
    },
  }
}

interface KeyRotator {
  rotate(): Promise<void>
}

async function newKeyRotator(
  kit: ContractKit,
  web3s: Web3[],
  privateKeys: string[]
): Promise<KeyRotator> {
  let index = 0
  const validator = (await kit.web3.eth.getAccounts())[0]
  const accountsWrapper = await kit.contracts.getAccounts()

  async function authorizeValidatorSigner(
    signer: string,
    signerWeb3: any,
    signerPrivateKey: string
  ) {
    const signerKit = newKitFromWeb3(signerWeb3)
    const blsPublicKey = getBlsPublicKey(signerPrivateKey)
    const blsPop = getBlsPoP(validator, signerPrivateKey)
    const pop = await (await signerKit.contracts.getAccounts()).generateProofOfKeyPossession(
      validator,
      signer
    )
    return (
      await accountsWrapper.authorizeValidatorSignerAndBls(signer, pop, blsPublicKey, blsPop)
    ).sendAndWaitForReceipt({
      from: validator,
    })
  }

  return {
    async rotate() {
      if (index < web3s.length) {
        const signerWeb3 = web3s[index]
        const signer: string = (await signerWeb3.eth.getAccounts())[0]
        const signerPrivateKey = privateKeys[index]
        await authorizeValidatorSigner(signer, signerWeb3, signerPrivateKey)
        index += 1
        assert.equal(await accountsWrapper.getValidatorSigner(validator), signer)
      }
    },
  }
}

async function calculateUptime(
  kit: ContractKit,
  validatorSetSize: number,
  lastBlockNumberOfEpoch: number,
  epochSize: number,
  lookbackWindow: number
): Promise<BigNumber[]> {
  // The parentAggregateSeal is not counted for the first or last blocks of the epoch
  const blocks = await concurrentMap(10, [...Array(epochSize - 2).keys()], (i) =>
    kit.web3.eth.getBlock(lastBlockNumberOfEpoch - epochSize + 2 + i)
  )
  const lastSignedBlock: number[] = new Array(validatorSetSize).fill(0)
  const tally: number[] = new Array(validatorSetSize).fill(0)

  // Follows updateUptime() in core/blockchain.go
  let windowBlocks = 1
  for (const block of blocks) {
    const bitmap = parseBlockExtraData(block.extraData).parentAggregatedSeal.bitmap

    for (let signerIndex = 0; signerIndex < validatorSetSize; signerIndex++) {
      if (bitIsSet(bitmap, signerIndex)) {
        lastSignedBlock[signerIndex] = block.number - 1
      }
      if (windowBlocks < lookbackWindow) {
        continue
      }
      const signedBlockWindowLastBlockNum = block.number - 1
      const signedBlockWindowFirstBlockNum = signedBlockWindowLastBlockNum - (lookbackWindow - 1)
      if (
        signedBlockWindowFirstBlockNum <= lastSignedBlock[signerIndex] &&
        lastSignedBlock[signerIndex] <= signedBlockWindowLastBlockNum
      ) {
        tally[signerIndex]++
      }
    }

    if (windowBlocks < lookbackWindow) {
      windowBlocks++
    }
  }
  const denominator = epochSize - lookbackWindow - 1
  return tally.map((signerTally) => new BigNumber(signerTally / denominator))
}

describe('replica swap tests', () => {
  const gethConfig: GethRunConfig = {
    migrate: false,
    runPath: TMP_PATH,
    verbosity: 4,
    // migrateTo: 25,
    networkId: 1101,
    network: 'local',
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30303,
        wsport: 8544,
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
  let election: any
  let stableToken: any
  let sortedOracles: any
  let epochRewards: any
  let goldToken: any
  let registry: any
  let reserve: any
  let validators: any
  let accounts: any
  let kit: ContractKit

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
    // kit = newKitFromWeb3(web3)

    // goldToken = await kit._web3Contracts.getGoldToken()
    // stableToken = await kit._web3Contracts.getStableToken()
    // sortedOracles = await kit._web3Contracts.getSortedOracles()
    // validators = await kit._web3Contracts.getValidators()
    // registry = await kit._web3Contracts.getRegistry()
    // reserve = await kit._web3Contracts.getReserve()
    // election = await kit._web3Contracts.getElection()
    // epochRewards = await kit._web3Contracts.getEpochRewards()
    // accounts = await kit._web3Contracts.getAccounts()
  }

  describe('replica behind single proxy', () => {
    const blockNumbers: number[] = []

    let epoch: number
    let validatorWeb3: Web3
    let replicaWeb3: Web3
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
      console.warn('Starting sync w/ replica')
      await waitToFinishInstanceSyncing(replica)

      epoch = 10 // new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
      assert.equal(epoch, 10)

      // Wait for an epoch transition to ensure everyone is connected to one another.
      await waitForEpochTransition(web3, epoch)

      const validatorWSWeb3Url = 'ws://localhost:8544'
      const validatorWSWeb3 = new Web3(validatorWSWeb3Url)
      const validatorKit = newKitFromWeb3(validatorWSWeb3)

      const validatorRpc = 'http://localhost:8545'
      validatorWeb3 = new Web3(validatorRpc)
      const repplicaRpc = 'http://localhost:8555'
      replicaWeb3 = new Web3(repplicaRpc)

      const tmp: any = replicaWeb3
      console.info(tmp)
      tmp.extend({
        property: 'istanbul',
        methods: [{ name: 'getReplicaState', call: 'istanbul_replicaState' }],
      })
      console.info(tmp)
      console.info(tmp.istanbul)
      // tmp.istanbul.getReplicaState().then(console.log)

      const handled: any = {}
      let errorMsg = ''
      let setSwap = false
      const recordNewBlock = async (header: BlockHeader) => {
        try {
          if (!setSwap) {
            // swap
            setSwap = true
          }
          if (handled[header.number]) {
            return
          }
          handled[header.number] = true
          blockNumbers.push(header.number)
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

      const subscription = validatorKit.web3.eth.subscribe('newBlockHeaders')
      subscription.on('data', recordNewBlock)

      // Wait for a few epochs while changing the validator set.
      while (blockNumbers.length < 9000000) {
        // Prepare for member swapping.
        await sleep(epoch)
      }
      ;(subscription as any).unsubscribe()

      // Wait for the current epoch to complete.
      await sleep(epoch)
      assert.equal(errorMsg, '')
    })

    it('replica should have good val enode table', async () => {
      // const tmp = replicaWeb3
    })

    it('proxy should be connected', async () => {
      //
    })

    it('should switch without downtime', async () => {
      if (missed.length !== 0) {
        missed.forEach((x: any) => console.warn(`Validator idx ${x.idx} missed block ${x.num}`))
      }
      assert.equal(missed.length, 0)
    })
  })
})
