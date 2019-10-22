import Web3 from 'web3'
import { getContractAddress, getHooks, GethTestConfig, sleep } from './utils'

const blockchainParametersAbi = [
  {
    constant: false,
    inputs: [
      {
        name: 'major',
        type: 'uint256',
      },
      {
        name: 'minor',
        type: 'uint256',
      },
      {
        name: 'patch',
        type: 'uint256',
      },
    ],
    name: 'setMinimumClientVersion',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

describe('exit tests', function(this: any) {
  this.timeout(0)

  const gethConfig: GethTestConfig = {
    migrateTo: 15,
    instances: [
      { name: 'validator', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
    ],
  }
  const hooks = getHooks(gethConfig)
  before(hooks.before)
  after(hooks.after)

  let web3: Web3
  let blockchainParametersAddress: string
  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'

  const restartGeth = async () => {
    // Restart the validator node
    await hooks.restart()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    web3 = new Web3('http://localhost:8545')
    await web3.eth.personal.unlockAccount(validatorAddress, '', 1000)

    blockchainParametersAddress = await getContractAddress('BlockchainParametersProxy')
  }

  const setMinimumClientVersion = async (major: number, minor: number, patch: number) => {
    // We need to run this operation from the validator account as it is the owner of the
    // contract.
    const _web3 = new Web3('http://localhost:8545')
    const _parameters = new _web3.eth.Contract(blockchainParametersAbi, blockchainParametersAddress)
    const tx = _parameters.methods.setMinimumClientVersion(major, minor, patch)
    const gas = await tx.estimateGas({ from: validatorAddress })
    return tx.send({ from: validatorAddress, gas })
  }

  describe('when running a node', () => {
    it('should exit when minimum version is updated', async () => {
      this.timeout(0)
      await restartGeth()
      await setMinimumClientVersion(1, 8, 99)
      await sleep(120)
      try {
        // It should have exited by now, call RPC to trigger error
        await web3.eth.getBlockNumber()
      } catch (_) {
        return
      }
      throw new Error('expected failure')
    })
  })
})
