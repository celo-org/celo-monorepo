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
      },
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
      },
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
  let medianRate: any
  let cDollarToCGoldRate: number[]

  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'

  // Arbitrary address.
  const DEF_FROM_ADDR = '0x5409ED021D9299bf6814279A6A1411A7e866A631'
  const DEF_FROM_PK = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'
  const DEF_TO_ADDR1 = '0xbBae99F0E1EE565404465638d40827b54D343638'
  const DEF_TO_ADDR2 = '0x4f5f8a3f45d179553e7b95119ce296010f50f6f1'
  const DEF_TO_ADDR3 = '0x1a748f924e5b346d68b2202e85ba6a2c72570b26'
  const DEF_AMOUNT: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))

  const restartGeth = async (transferCeloDollarToFromAddr: boolean = true) => {
    // Restart the validator node
    await hooks.restart()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    web3 = new Web3('http://localhost:8545')
    await unlockAccount(validatorAddress)

    const startBalance = DEF_AMOUNT.times(10)
    await transferCeloGold(validatorAddress, DEF_FROM_ADDR, startBalance)

    stableTokenAddress = await getContractAddress('StableTokenProxy')
    stableToken = new web3.eth.Contract(stableTokenAbi, stableTokenAddress)

    if (transferCeloDollarToFromAddr) {
      await transferCeloDollars(validatorAddress, DEF_FROM_ADDR, startBalance)
    }

    sortedOraclesAddress = await getContractAddress('SortedOraclesProxy')
    medianRate = new web3.eth.Contract(medianRateABI, sortedOraclesAddress)
    cDollarToCGoldRate = await medianRate.methods.medianRate(stableTokenAddress).call()

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
    event: any = 'confirmation'
  ) => {
    await unlockAccount(fromAddress)
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
        await web3.eth.sendTransaction(tx).on(event, (_: any, receipt: any) => resolve(receipt))
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

  const convertCGToCD = (cGold: BigNumber) => {
    return cGold.multipliedBy(cDollarToCGoldRate[0]).dividedBy(cDollarToCGoldRate[1])
  }

  describe('Tx pool tests', () => {
    it('when tx pool gets full, ensure that celo gold gas denominated tx gets pruned', async () => {
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
      await transferCeloGold(
        DEF_FROM_ADDR,
        DEF_TO_ADDR1,
        DEF_AMOUNT,
        { gasPrice: new BigNumber(Web3.utils.toWei('2', 'gwei')) },
        'transactionHash'
      ).catch((err) => console.log(err))

      await transferCeloGold(
        DEF_FROM_ADDR,
        DEF_TO_ADDR2,
        DEF_AMOUNT,
        { gasPrice: new BigNumber(Web3.utils.toWei('1', 'gwei')) },
        'transactionHash'
      ).catch((err) => console.log(err))

      await transferCeloGold(
        DEF_FROM_ADDR,
        DEF_TO_ADDR3,
        DEF_AMOUNT,
        { gasPrice: new BigNumber(Web3.utils.toWei('3', 'gwei')) },
        'transactionHash'
      ).catch((err) => console.log(err))

      let txpoolContent = await getTxpoolContents(hooks.gethBinaryPath, fullInstance)
      var txpoolContentJSON = JSON.parse(txpoolContent.toString())

      // The first transaction (nonce == 0) should be the only pending transaction
      assert.equal(Object.keys(txpoolContentJSON.pending).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.pending)[0], DEF_FROM_ADDR)
      assert.equal(Object.keys(txpoolContentJSON.pending[DEF_FROM_ADDR]).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.pending[DEF_FROM_ADDR])[0], '0')

      // The third transaction (nonce == 2) should be the only queued transaction
      assert.equal(Object.keys(txpoolContentJSON.queued).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.queued)[0], DEF_FROM_ADDR)
      assert.equal(Object.keys(txpoolContentJSON.queued[DEF_FROM_ADDR]).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.queued[DEF_FROM_ADDR])[0], '2')
    })

    it('when tx pool gets full, ensure that celo dollar gas denominated tx gets pruned', async () => {
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
      await transferCeloGold(
        DEF_FROM_ADDR,
        DEF_TO_ADDR1,
        DEF_AMOUNT,
        { gasPrice: new BigNumber(Web3.utils.toWei('2', 'gwei')) },
        'transactionHash'
      ).catch((err) => console.log(err))

      // Number of C$ for 1 CG
      let cDollarGasFee = new BigNumber(Web3.utils.toWei('1', 'gwei'))
        .multipliedBy(cDollarToCGoldRate[0])
        .dividedBy(cDollarToCGoldRate[1])

      await transferCeloGold(
        DEF_FROM_ADDR,
        DEF_TO_ADDR2,
        DEF_AMOUNT,
        {
          gasCurrency: stableTokenAddress,
          gasPrice: convertCGToCD(new BigNumber(Web3.utils.toWei('1', 'gwei'))),
        },
        'transactionHash'
      ).catch((err) => console.log(err))

      await transferCeloGold(
        DEF_FROM_ADDR,
        DEF_TO_ADDR3,
        DEF_AMOUNT,
        { gasPrice: new BigNumber(Web3.utils.toWei('3', 'gwei')) },
        'transactionHash'
      ).catch((err) => console.log(err))

      let txpoolContent = await getTxpoolContents(hooks.gethBinaryPath, fullInstance)
      var txpoolContentJSON = JSON.parse(txpoolContent.toString())

      // The first transaction (nonce == 0) should be the only pending transaction
      assert.equal(Object.keys(txpoolContentJSON.pending).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.pending)[0], DEF_FROM_ADDR)
      assert.equal(Object.keys(txpoolContentJSON.pending[DEF_FROM_ADDR]).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.pending[DEF_FROM_ADDR])[0], '0')

      // The third transaction (nonce == 2) should be the only queued transaction
      assert.equal(Object.keys(txpoolContentJSON.queued).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.queued)[0], DEF_FROM_ADDR)
      assert.equal(Object.keys(txpoolContentJSON.queued[DEF_FROM_ADDR]).length, 1)
      assert.equal(Object.keys(txpoolContentJSON.queued[DEF_FROM_ADDR])[0], '2')
    })

    it('when tx with non whitelisted currency is submitted, then tx submission should fail', async () => {
      const fullInstance = {
        name: 'txFull',
        validating: false,
        syncmode: 'full',
        lightserv: true,
        port: 30305,
        rpcport: 8545,
        privateKey: DEF_FROM_PK,
      }

      await restartGeth()
      await startGeth(hooks.gethBinaryPath, fullInstance)
      await sleep(2)

      web3 = new Web3('http://localhost:8545')
      await unlockAccount(DEF_FROM_ADDR)

      try {
        await transferCeloGold(
          DEF_FROM_ADDR,
          DEF_TO_ADDR1,
          DEF_AMOUNT,
          {
            gasCurrency: DEF_TO_ADDR2,
            gasPrice: new BigNumber(Web3.utils.toWei('1', 'gwei')),
            gas: 40000,
          },
          'transactionHash'
        )
      } catch (error) {
        assert.include(error.toString(), 'Returned error: non-whitelisted gas currency')
      }
    })

    it('when tx with celo dollar denominated gas and insufficient celo dollar balance for the sender, then tx submission should fail', async () => {
      const fullInstance = {
        name: 'txFull',
        validating: false,
        syncmode: 'full',
        lightserv: true,
        port: 30305,
        rpcport: 8545,
        privateKey: DEF_FROM_PK,
      }
      // Don't transfer celo addr to DEF_FROM_ADDR
      await restartGeth(false)
      await startGeth(hooks.gethBinaryPath, fullInstance)
      await sleep(2)

      web3 = new Web3('http://localhost:8545')

      await unlockAccount(DEF_FROM_ADDR)

      try {
        await transferCeloGold(
          DEF_FROM_ADDR,
          DEF_TO_ADDR1,
          DEF_AMOUNT,
          {
            gasCurrency: stableTokenAddress,
            gasPrice: new BigNumber(Web3.utils.toWei('1', 'gwei')),
            gas: 40000,
          },
          'transactionHash'
        )
      } catch (error) {
        assert.include(
          error.toString(),
          'Returned error: insufficient funds for gas * price + value'
        )
      }
    })
  })

  describe('Worker tests', () => {
    let tx1Hash: any
    let tx2Hash: any
    let tx3Hash: any
    let tx4Hash: any
    let minedBlockNumber: number
    let sender1InitialGoldBalance: BigNumber
    let sender1InitialDollarBalance: BigNumber
    let sender2InitialGoldBalance: BigNumber
    let sender2InitialDollarBalance: BigNumber
    let sender3InitialGoldBalance: BigNumber
    let sender3InitialDollarBalance: BigNumber
    let validatorInitialGoldBalance: BigNumber
    let validatorInitialDollarBalance: BigNumber

    let sender1: string
    let sender2: string
    let sender3: string

    before(async function(this: any) {
      const validatorInstance = {
        name: 'validator',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
      }

      await restartGeth()
      await startGeth(hooks.gethBinaryPath, validatorInstance)
      await sleep(2)

      web3 = new Web3('http://localhost:8545')
      await unlockAccount(validatorAddress)

      // Create sender accounts
      sender1 = await web3.eth.personal.newAccount('')
      await unlockAccount(sender1)
      sender2 = await web3.eth.personal.newAccount('')
      await unlockAccount(sender2)
      sender3 = await web3.eth.personal.newAccount('')
      await unlockAccount(sender3)

      await transferCeloGold(validatorAddress, sender1, DEF_AMOUNT.multipliedBy(10))
      await transferCeloGold(validatorAddress, sender2, DEF_AMOUNT.multipliedBy(10))
      await transferCeloGold(validatorAddress, sender3, DEF_AMOUNT.multipliedBy(10))
      await transferCeloDollars(validatorAddress, sender1, DEF_AMOUNT)
      await transferCeloDollars(validatorAddress, sender3, DEF_AMOUNT)

      // Let a few blocks get mined
      await sleep(10)

      // Turn off mining so that the submitted txns will be in one block when mining is turned on
      setMining(hooks.gethBinaryPath, validatorInstance, false)

      sender1InitialGoldBalance = new BigNumber(await web3.eth.getBalance(sender1))
      sender1InitialDollarBalance = new BigNumber(
        await stableToken.methods.balanceOf(sender1).call()
      )
      sender2InitialGoldBalance = new BigNumber(await web3.eth.getBalance(sender2))
      sender2InitialDollarBalance = new BigNumber(
        await stableToken.methods.balanceOf(sender2).call()
      )
      sender3InitialGoldBalance = new BigNumber(await web3.eth.getBalance(sender3))
      sender3InitialDollarBalance = new BigNumber(
        await stableToken.methods.balanceOf(sender3).call()
      )
      validatorInitialGoldBalance = new BigNumber(await web3.eth.getBalance(validatorAddress))
      validatorInitialDollarBalance = new BigNumber(
        await stableToken.methods.balanceOf(validatorAddress).call()
      )

      tx1Hash = await transferCeloGold(
        sender1,
        DEF_TO_ADDR1,
        DEF_AMOUNT,
        {
          gasCurrency: stableTokenAddress,
          gasPrice: convertCGToCD(new BigNumber(Web3.utils.toWei('1', 'gwei'))),
          gas: 400000,
          gasFeeRecipient: validatorAddress,
        },
        'transactionHash'
      )

      tx2Hash = await transferCeloGold(
        sender2,
        DEF_TO_ADDR2,
        DEF_AMOUNT,
        {
          gasPrice: new BigNumber(Web3.utils.toWei('10', 'gwei')),
          gas: 400000,
          gasFeeRecipient: validatorAddress,
        },
        'transactionHash'
      )

      tx3Hash = await transferCeloGold(
        sender3,
        DEF_TO_ADDR3,
        DEF_AMOUNT,
        {
          gasCurrency: stableTokenAddress,
          gasPrice: convertCGToCD(new BigNumber(Web3.utils.toWei('2', 'gwei'))),
          gas: 400000,
          gasFeeRecipient: validatorAddress,
        },
        'transactionHash'
      )

      // This transaction should be mined after tx1, since it's from the same sender.
      tx4Hash = await transferCeloGold(
        sender1,
        DEF_TO_ADDR1,
        DEF_AMOUNT,
        {
          gasPrice: new BigNumber(Web3.utils.toWei('5', 'gwei')),
          gas: 400000,
          gasFeeRecipient: validatorAddress,
        },
        'transactionHash'
      )

      // Get the current block number
      minedBlockNumber = (await web3.eth.getBlockNumber()) + 1

      // Turn on mining
      setMining(hooks.gethBinaryPath, validatorInstance, true)

      // Wait for the block to be mined
      await sleep(10)
    })

    it('when the worker creates a block proposal to mine, the txns within that block should be sorted by price desc (with the added contraint that for a given account, txns are sorted by nonce asc)', async () => {
      var expectedMinedTxOrder = [tx2Hash, tx4Hash, tx3Hash, tx1Hash]
      var minedBlock = await web3.eth.getBlock(minedBlockNumber)

      // Verify that the ordering of the txns is [tx2Hash, tx3Hash, tx1Hash, tx4Hash]
      assert.deepEqual(minedBlock.transactions, [tx2Hash, tx3Hash, tx1Hash, tx4Hash])
    })

    it('when the worker mines a block, the balances for the senders and validator should be adjusted accordingly', async () => {
      let sender1FinalGoldBalance = sender1InitialGoldBalance
      let sender1FinalDollarBalance = sender1InitialDollarBalance
      let sender2FinalGoldBalance = sender2InitialGoldBalance
      let sender2FinalDollarBalance = sender2InitialDollarBalance
      let sender3FinalGoldBalance = sender3InitialGoldBalance
      let sender3FinalDollarBalance = sender3InitialDollarBalance
      let validatorFinalGoldBalance = validatorInitialGoldBalance
      let validatorFinalDollarBalance = validatorInitialDollarBalance

      // tx1 is a transfer of DEF_AMOUNT CG from sender1 to DEF_TO_ADDR1 paid using CD for tx fee
      const tx1 = await web3.eth.getTransaction(tx1Hash)
      const tx1Receipt = await web3.eth.getTransactionReceipt(tx1Hash)
      const tx1Fee = new BigNumber(tx1.gasPrice).times(tx1Receipt.gasUsed)
      sender1FinalDollarBalance = sender1FinalDollarBalance.minus(tx1Fee)
      validatorFinalDollarBalance = validatorFinalDollarBalance.plus(tx1Fee)
      sender1FinalGoldBalance = sender1FinalGoldBalance.minus(DEF_AMOUNT)

      // tx2 is a transfer of DEF_AMOUNT CG from sender2 to DEF_TO_ADDR2 paid using CG for tx fee
      const tx2 = await web3.eth.getTransaction(tx2Hash)
      const tx2Receipt = await web3.eth.getTransactionReceipt(tx2Hash)
      const tx2Fee = new BigNumber(tx2.gasPrice).times(tx2Receipt.gasUsed)
      sender2FinalGoldBalance = sender2FinalGoldBalance.minus(DEF_AMOUNT.plus(tx2Fee))
      validatorFinalGoldBalance = validatorFinalGoldBalance.plus(tx2Fee)

      // tx3 is a transfer of DEF_AMOUNT CG from sender3 to DEF_TO_ADDR3 paid using CD for tx fee
      const tx3 = await web3.eth.getTransaction(tx3Hash)
      const tx3Receipt = await web3.eth.getTransactionReceipt(tx3Hash)
      const tx3Fee = new BigNumber(tx3.gasPrice).times(tx3Receipt.gasUsed)
      sender3FinalDollarBalance = sender3FinalDollarBalance.minus(tx3Fee)
      validatorFinalDollarBalance = validatorFinalDollarBalance.plus(tx3Fee)
      sender3FinalGoldBalance = sender3FinalGoldBalance.minus(DEF_AMOUNT)

      // tx4 is a transfer of DEF_AMOUNT CG from sender1 to DEF_TO_ADDR1 paid using CG for tx fee
      const tx4 = await web3.eth.getTransaction(tx4Hash)
      const tx4Receipt = await web3.eth.getTransactionReceipt(tx4Hash)
      const tx4Fee = new BigNumber(tx4.gasPrice).times(tx4Receipt.gasUsed)
      sender1FinalGoldBalance = sender1FinalGoldBalance.minus(tx4Fee)
      validatorFinalGoldBalance = validatorFinalGoldBalance.plus(tx4Fee)
      sender1FinalGoldBalance = sender1FinalGoldBalance.minus(DEF_AMOUNT)

      assert.deepEqual(
        sender1FinalDollarBalance,
        new BigNumber(await stableToken.methods.balanceOf(sender1).call())
      )
      assert.deepEqual(sender1FinalGoldBalance, new BigNumber(await web3.eth.getBalance(sender1)))
      assert.deepEqual(
        sender2FinalDollarBalance,
        new BigNumber(await stableToken.methods.balanceOf(sender2).call())
      )
      assert.deepEqual(sender2FinalGoldBalance, new BigNumber(await web3.eth.getBalance(sender2)))
      assert.deepEqual(
        sender3FinalDollarBalance,
        new BigNumber(await stableToken.methods.balanceOf(sender3).call())
      )
      assert.deepEqual(sender3FinalGoldBalance, new BigNumber(await web3.eth.getBalance(sender3)))
      assert.deepEqual(
        validatorFinalDollarBalance,
        new BigNumber(await stableToken.methods.balanceOf(validatorAddress).call())
      )
      assert.deepEqual(
        validatorFinalGoldBalance,
        new BigNumber(await web3.eth.getBalance(validatorAddress))
      )
    })
  })
})
