import {
  erc20Abi,
  getContractAddress,
  getHooks,
  importGenesis,
  initAndStartGeth,
} from '@celo/celotool/geth_tests/src/lib/utils'
import BigNumber from 'bignumber.js'
import { strip0x } from '../src/lib/utils'
const assert = require('chai').assert
const Web3 = require('web3')

// TODO(asa): Use the contract kit here instead
const bondedDepositsAbi = [
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    name: 'cumulativeRewardWeights',
    outputs: [
      {
        name: 'numerator',
        type: 'uint256',
      },
      {
        name: 'denominator',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'redeemRewards',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'delegate',
        type: 'address',
      },
      {
        name: 'v',
        type: 'uint8',
      },
      {
        name: 'r',
        type: 'bytes32',
      },
      {
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'delegateRewards',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

describe('governance tests', () => {
  const gethConfig = {
    migrate: true,
    instances: [
      { name: 'validator', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
    ],
  }

  const hooks: any = getHooks(gethConfig)
  let web3: any
  let bondedDeposits: any
  let gasPrice: number
  let goldTokenAddress: string
  let goldToken: any

  before(async function(this: any) {
    this.timeout(0)
    await hooks.before()
  })

  after(hooks.after)

  const restart = async () => {
    await hooks.restart()
    web3 = new Web3('http://localhost:8545')
    const bondedDepositsAddress = await getContractAddress('BondedDepositsProxy')
    const checksumAddress = web3.utils.toChecksumAddress(bondedDepositsAddress)
    bondedDeposits = new web3.eth.Contract(bondedDepositsAbi, checksumAddress)
    goldTokenAddress = await getContractAddress('GoldTokenProxy')
    const goldChecksumAddress = web3.utils.toChecksumAddress(goldTokenAddress)
    goldToken = new web3.eth.Contract(erc20Abi, goldChecksumAddress)
    gasPrice = parseInt(await web3.eth.getGasPrice(), 10)
  }

  const unlockAccount = async (address: string, web3: any) => {
    // Assuming empty password
    await web3.eth.personal.unlockAccount(address, '', 1000)
  }

  const getParsedSignatureOfAddress = async (address: string, signer: string, signerWeb3: any) => {
    // @ts-ignore
    const hash = signerWeb3.utils.soliditySha3({ type: 'address', value: address })
    const signature = strip0x(await signerWeb3.eth.sign(hash, signer))
    return {
      r: `0x${signature.slice(0, 64)}`,
      s: `0x${signature.slice(64, 128)}`,
      v: signerWeb3.utils.hexToNumber(signature.slice(128, 130)),
    }
  }
  const delegateRewards = async (account: string, delegate: string, txOptions: any = {}) => {
    const delegateWeb3 = new Web3('http://localhost:8547')
    await unlockAccount(delegate, delegateWeb3)
    const { r, s, v } = await getParsedSignatureOfAddress(account, delegate, delegateWeb3)
    await unlockAccount(account, web3)
    const tx = bondedDeposits.methods.delegateRewards(delegate, v, r, s)
    let gas = txOptions.gas
    // We overestimate to account for variations in the fraction reduction necessary to redeem
    // rewards.
    if (!gas) {
      gas = 2 * (await tx.estimateGas({ ...txOptions }))
    }
    return await tx.send({ from: account, ...txOptions, gasPrice, gas })
  }

  // const redeemRewards = async (account: string, txOptions: any = {}) => {
  //   await unlockAccount(account, web3)
  //   const tx = bondedDeposits.methods.redeemRewards()
  //   let gas = txOptions.gas
  //   // We overestimate to account for variations in the fraction reduction necessary to redeem
  //   // rewards.
  //   if (!gas) {
  //     gas = 2 * (await tx.estimateGas({ ...txOptions }))
  //   }
  //   return await tx.send({ from: account, ...txOptions, gasPrice, gas })
  // }

  describe('when a bonded deposit account with weight exists', () => {
    const account = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
    const delegate = '0x5409ed021d9299bf6814279a6a1411a7e866a631'

    before(async function() {
      this.timeout(0)
      await restart()
      const delegateInstance = {
        name: 'delegate',
        validating: false,
        syncmode: 'full',
        port: 30305,
        rpcport: 8547,
        privateKey: 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
      }
      await initAndStartGeth(hooks.gethBinaryPath, delegateInstance)
      // Note that we don't need to create an account or make a deposit as this has already been
      // done in the migration.
      await delegateRewards(account, delegate)
    })

    // it('should be able to redeem block rewards', async function(this: any) {
    //   this.timeout(0) // Disable test timeout
    //   await sleep(1)
    //   await redeemRewards(account)
    //   assert.isAtLeast(await web3.eth.getBalance(delegate), 1)
    // })
  })

  describe('when adding any block', () => {
    let goldGenesisSupply: any
    let addressesWithBalance: string[] = []
    beforeEach(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
      const genesis = await importGenesis()
      goldGenesisSupply = new BigNumber(0)
      for (let validator in genesis.alloc) {
        addressesWithBalance.push(validator)
        goldGenesisSupply = goldGenesisSupply.plus(genesis.alloc[validator].balance)
      }
      // Block rewards are paid to governance and bonded deposits.
      // Governance also receives a portion of transaction fees.
      addressesWithBalance.push(await getContractAddress('GovernanceProxy'))
      addressesWithBalance.push(await getContractAddress('BondedDepositsProxy'))
      // Some gold is sent to the reserve and exchange during migrations.
      addressesWithBalance.push(await getContractAddress('ReserveProxy'))
      addressesWithBalance.push(await getContractAddress('ExchangeProxy'))
    })

    it('should update the Celo Gold total supply correctly', async function(this: any) {
      // To register a validator group, we send gold to a new address not included in
      // `addressesWithBalance`. Therefore, we check the gold total supply at a block before
      // that gold is sent.
      const blockNumber = 255
      const goldTotalSupply = await goldToken.methods.totalSupply().call({}, blockNumber)
      const balances = await Promise.all(
        addressesWithBalance.map(
          async (a: string) => new BigNumber(await web3.eth.getBalance(a, blockNumber))
        )
      )
      const expectedGoldTotalSupply = balances.reduce((total: BigNumber, b: BigNumber) =>
        b.plus(total)
      )
      assert.isAtLeast(expectedGoldTotalSupply, goldGenesisSupply)
      assert.equal(goldTotalSupply.toString(), expectedGoldTotalSupply.toString())
    })
  })
})
