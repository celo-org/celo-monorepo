import {
  erc20Abi,
  getHooks,
  initAndStartGeth,
  startGeth,
  sleep,
  getEnode,
  getContractAddress,
  getTxpoolContents,
} from '@celo/celotool/geth_tests/src/lib/utils'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Tx } from 'web3/eth/types'
import { assert } from 'chai'

const stableTokenAbi = erc20Abi.concat([
  {
    constant: false,
    inputs: [
      {
        name: 'rateNumerator',
        type: 'uint256',
      },
      {
        name: 'rateDenominator',
        type: 'uint256',
      },
      {
        name: 'updatePeriod',
        type: 'uint256',
      },
    ],
    name: 'setInflationParameters',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getInflationParameters',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
])

const medianRateABI = [
    {
      constant: true,
      inputs: [
        {
          name: 'token',
          type: 'address',
        }
      ],
      name: 'medianRate',
      outputs: [
        {
          name: '',
          type: 'uint128',
        },
        {
          name: '',
          type: 'uint128',
        }
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
]

describe('celo dollar gas currency tests', function(this: any) {
  this.timeout(0)

  const gethConfig = {
    migrateTo: 8,
    instances: [
      { name: 'validator', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
    ],
  }
  
  const hooks = getHooks(gethConfig)
  before(hooks.before)
  after(hooks.after)

  let web3: Web3
  let stableTokenAddress: string
  let stableToken: any

  let sortedOraclesAddress: string
  let medianRate: Number[2]

  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'

  // Arbitrary address.
  const DEF_FROM_ADDR = '0x5409ED021D9299bf6814279A6A1411A7e866A631'
  const DEF_FROM_PK = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'  
  const DEF_TO_ADDR1 = '0xbBae99F0E1EE565404465638d40827b54D343638'
  const DEF_TO_ADDR2 = '0x4f5f8a3f45d179553e7b95119ce296010f50f6f1'
  const DEF_TO_ADDR3 = '0x1a748f924e5b346d68b2202e85ba6a2c72570b26'
  const DEF_AMOUNT: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))

  const restartGeth = async () => {
    // Restart the validator node
    await hooks.restart()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    web3 = new Web3('http://localhost:8545')
    await unlockAccount(validatorAddress)

    const startBalance = DEF_AMOUNT.times(10)
    console.log("Transferring celo gold from validator address")
    await transferCeloGold(validatorAddress, DEF_FROM_ADDR, startBalance)
    
    stableTokenAddress = await getContractAddress('StableTokenProxy')
    stableToken = new web3.eth.Contract(stableTokenAbi, stableTokenAddress)
    await transferCeloDollars(validatorAddress, DEF_FROM_ADDR, startBalance)

    sortedOraclesAddress = await getContractAddress('SortedOraclesProxy')
    medianRate = new web3.eth.Contract(medianRateABI, sortedOraclesAddress)
    cDollarToCGoldRate = await medianRate.methods.medianRate(stableTokenAddress)

    // Spin up a node that we can sync with.
    const fullInstance = {
      name: 'txFull',
      validating: false,
      syncmode: 'full',
      lightserv: true,
      port: 30305,
      rpcport: 8547,
      peers: [await getEnode(8545)],
      privateKey: DEF_FROM_PK,
    }
    await initAndStartGeth(hooks.gethBinaryPath, fullInstance)

    // Give the node time to sync the latest block.
    await sleep(10)

    await hooks.after()
  }

  const unlockAccount = async (address: string) => {
    // Assuming empty password
    await web3.eth.personal.unlockAccount(address, '', 1000)
  }

  const transferCeloGold = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: any = {},
    event: any = "confirmation"
  ) => {
    await unlockAccount(fromAddress)
    // Hack to get the node to suggest a price for us.
    // Otherwise, web3 will suggest the default gold price.
    if (txOptions.gasCurrency) {
      txOptions.gasPrice = '0'
    }
    const tx: Tx = {
      from: fromAddress,
      to: toAddress,
      value: amount.toString(),
      ...txOptions,
    }
    if (!tx.gas) {
      tx.gas = await web3.eth.estimateGas(tx)
    }
 
    return new Promise(async (resolve, reject) => {
      try {
        await web3.eth
          .sendTransaction(tx)
          .on(event, (_: any, receipt: any) => resolve(receipt))
      } catch (err) {
        reject(err)
      }
    })
  }

  const transferCeloDollars = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: any = {}
  ) => {
    await unlockAccount(fromAddress)
    // Hack to get the node to suggest a price for us.
    // Otherwise, web3 will suggest the default gold price.
    if (txOptions.gasCurrency) {
      txOptions.gasPrice = '0'
    }
    const tx = stableToken.methods.transfer(toAddress, amount.toString())
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }

    return new Promise(async (resolve, reject) => {
      try {
        await tx
          .send({ from: fromAddress, ...txOptions, gas })
          .on('confirmation', (_: any, receipt: any) => resolve(receipt))
      } catch (err) {
        reject(err)
      }
    })
  }

  describe("Tx pool tests", () => {
    it("when tx pool gets full, ensure that celo gold gas denominated tx gets pruned", async () => {
      const fullInstance = {
        name: 'txFull',
        validating: false,
        syncmode: 'full',
        lightserv: true,
        port: 30305,
        rpcport: 8545,
	maxtxpoolsize: 1,
	privateKey: DEF_FROM_PK,
      }
      await restartGeth()
      await startGeth(hooks.gethBinaryPath, fullInstance)
      await sleep(2)

      web3 = new Web3('http://localhost:8545')
      
      await unlockAccount(DEF_FROM_ADDR)

      // Submit 3 transactions to 3 different addresses.  The second one has the lowest gas price, and should be the one that is pruned from the txpool.
      await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR1, DEF_AMOUNT, {gasPrice: new BigNumber(Web3.utils.toWei('2', 'gwei'))}, 'transactionHash').catch(err => console.log(err))

      await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR2, DEF_AMOUNT, {gasPrice: new BigNumber(Web3.utils.toWei('1', 'gwei'))}, 'transactionHash').catch(err => console.log(err))

      await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR3, DEF_AMOUNT, {gasPrice: new BigNumber(Web3.utils.toWei('3', 'gwei'))}, 'transactionHash').catch(err => console.log(err))

      let txpoolContent = await getTxpoolContents(hooks.gethBinaryPath, fullInstance)
      var txpoolContentJSON = JSON.parse(txpoolContent.toString())

      // The first transaction (nonce == 0) should be the only pending transaction
      assert.equal(Object.keys(txpoolContentJSON.pending).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.pending)[0], DEF_FROM_ADDR)
      assert.equal(Object.keys(txpoolContentJSON.pending[DEF_FROM_ADDR]).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.pending[DEF_FROM_ADDR])[0], "0")

      // The third transaction (nonce == 2) should be the only queued transaction
      assert.equal(Object.keys(txpoolContentJSON.queued).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.queued)[0], DEF_FROM_ADDR)
      assert.equal(Object.keys(txpoolContentJSON.queued[DEF_FROM_ADDR]).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.queued[DEF_FROM_ADDR])[0], "2")
    })

  it("when tx pool gets full, ensure that celo dollar gas denominated tx gets pruned", async () => {
      const fullInstance = {
        name: 'txFull',
        validating: false,
        syncmode: 'full',
        lightserv: true,
        port: 30305,
        rpcport: 8545,
	maxtxpoolsize: 1,
	privateKey: DEF_FROM_PK,
      }
      await restartGeth()
      await startGeth(hooks.gethBinaryPath, fullInstance)
      await sleep(2)

      web3 = new Web3('http://localhost:8545')
      
      await unlockAccount(DEF_FROM_ADDR)

      // Submit 3 transactions to 3 different addresses.  The second one has the lowest gas price, and should be the one that is pruned from the txpool.
      await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR1, DEF_AMOUNT, {gasPrice: new BigNumber(Web3.utils.toWei('2', 'gwei'))}, 'transactionHash').catch(err => console.log(err))

      // Number of C$ for 1 CG
      let cDollar = new BigNumber(Web3.utils.toWei('1', 'gwei')).multipliedBy(cDollarToCGoldRate[0]).dividedBy(cDollarToCGoldRate[1])
      await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR2, DEF_AMOUNT, {gasCurrency: stableTokenAddress, gasPrice: cDollar}, 'transactionHash').catch(err => console.log(err))

      await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR3, DEF_AMOUNT, {gasPrice: new BigNumber(Web3.utils.toWei('3', 'gwei'))}, 'transactionHash').catch(err => console.log(err))

      let txpoolContent = await getTxpoolContents(hooks.gethBinaryPath, fullInstance)
      var txpoolContentJSON = JSON.parse(txpoolContent.toString())

      // The first transaction (nonce == 0) should be the only pending transaction
      assert.equal(Object.keys(txpoolContentJSON.pending).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.pending)[0], DEF_FROM_ADDR)
      assert.equal(Object.keys(txpoolContentJSON.pending[DEF_FROM_ADDR]).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.pending[DEF_FROM_ADDR])[0], "0")

      // The third transaction (nonce == 2) should be the only queued transaction
      assert.equal(Object.keys(txpoolContentJSON.queued).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.queued)[0], DEF_FROM_ADDR)
      assert.equal(Object.keys(txpoolContentJSON.queued[DEF_FROM_ADDR]).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.queued[DEF_FROM_ADDR])[0], "2")
    })
  })

})
