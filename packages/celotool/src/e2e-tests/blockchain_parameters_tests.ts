import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { BlockchainParametersWrapper } from '@celo/contractkit/lib/wrappers/BlockchainParameters'
import { assert } from 'chai'
import Web3 from 'web3'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getHooks, sleep } from './utils'

const TMP_PATH = '/tmp/e2e'
const rpcURL = 'http://localhost:8545'

describe('Blockchain parameters tests', function (this: any) {
  this.timeout(0)

  let kit: ContractKit
  let parameters: BlockchainParametersWrapper

  const gethConfig: GethRunConfig = {
    migrate: true,
    runPath: TMP_PATH,
    keepData: false,
    networkId: 1101,
    network: 'local',
    genesisConfig: {
      churritoBlock: 0,
      donutBlock: 0,
      espressoBlock: 0,
    },
    instances: [
      {
        name: 'validator',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
      },
    ],
  }

  const hooks = getHooks(gethConfig)

  before(async function (this: any) {
    this.timeout(0)
    await hooks.before()
  })

  after(async function (this: any) {
    this.timeout(0)
    await hooks.after()
  })

  const validatorAddress: string = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'

  const restartGeth = async () => {
    // Restart the validator node
    await hooks.restart()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)

    kit = newKitFromWeb3(new Web3(rpcURL))

    await kit.connection.web3.eth.personal.unlockAccount(validatorAddress, '', 1000)
    parameters = await kit.contracts.getBlockchainParameters()
  }

  describe('when running a node', () => {
    before(async () => {
      await restartGeth()
    })
    it('block limit should have been set using governance', async () => {
      this.timeout(0)
      const res = await parameters.getBlockGasLimit()
      assert.equal(0, res.comparedTo(13000000))
    })
    it('changing the block gas limit', async () => {
      this.timeout(0)
      await parameters.setBlockGasLimit(23000000).send({ from: validatorAddress })
      await sleep(2)
      const res = await parameters.getBlockGasLimit()
      assert.equal(0, res.comparedTo(23000000))
    })
  })
})
