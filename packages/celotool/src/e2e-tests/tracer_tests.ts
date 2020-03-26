import { CeloContract } from '@celo/contractkit'
import { ContractKit, newKit } from '@celo/contractkit'
import { AllContracts } from '@celo/contractkit/lib/base'
import { traceBlock } from '@celo/contractkit/lib/utils/web3-utils'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { ReserveWrapper } from '@celo/contractkit/lib/wrappers/Reserve'
import { Address, normalizeAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import fs from 'fs'
import Web3 from 'web3'
import { EventLog } from 'web3-core'
import { TransactionReceipt } from 'web3-core'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { MonorepoRoot, getContext, sleep } from './utils'
import { spawnCmdWithExitOnFailure } from '../lib/utils'

const TMP_PATH = '/tmp/e2e'

const testContractSource = `
pragma solidity ^0.5.8;

contract TestContract {
  function transfer(address payable to) external payable returns (bool) {
    to.transfer(msg.value);
    return true;
  }

  function transferThenIgnoreRevert(address payable to) external payable returns (bool) {
    to.transfer(msg.value);
    bool success;
    (success,) = address(this).call(abi.encodeWithSignature("alwaysRevert()"));
    return success;
  }

  function alwaysRevert() public pure {
    revert('always revert!');
  }

  function selfDestruct(address payable to) external payable {
    selfdestruct(to);
  }
}
`

class DerivedAccountAssets {
  lockedGold: BigNumber
  lockedGoldPendingWithdrawl: BigNumber
  pendingVotes: BigNumber
  tokenUnits: Record<string, BigNumber>
  activeVoteUnits: Record<Address, BigNumber>

  constructor() {
    this.lockedGold = new BigNumber(0)
    this.lockedGoldPendingWithdrawl = new BigNumber(0)
    this.pendingVotes = new BigNumber(0)
    this.tokenUnits = {}
    this.activeVoteUnits = {}
  }
}

class ReleaseGoldAssets extends DerivedAccountAssets {
  gold: BigNumber

  constructor() {
    super()
    this.gold = new BigNumber(0)
  }
}

class AccountAssets extends DerivedAccountAssets {
  gold: BigNumber
  releaseGold: Record<Address, ReleaseGoldAssets>

  constructor() {
    super()
    this.gold = new BigNumber(0)
    this.releaseGold = {}
  }
}

function getAccount(
  accounts: Record<Address, AccountAssets>,
  accountAddress: Address,
  filter: boolean
): AccountAssets | undefined {
  const address = normalizeAddress(accountAddress)
  if (filter && !(address in accounts)) return undefined
  return accounts[address] || (accounts[address] = new AccountAssets())
}

function assertEqualBN(value: BigNumber, expected: BigNumber) {
  assert.equal(value.toString(), expected.toString())
}

async function trackTransfers(
  kit: ContractKit,
  blockNumber: number,
  assets: Record<Address, AccountAssets> | undefined = undefined,
  filter: boolean = false
): Promise<Record<Address, AccountAssets>> {
  const ret = assets || {}

  const goldTransfers = await traceBlock(
    kit.web3.currentProvider,
    blockNumber,
    'cgldTransferTracer'
  )
  for (const transaction of goldTransfers) {
    for (const transfer of transaction.transfers) {
      const from = getAccount(ret, transfer.from, filter)
      const to = getAccount(ret, transfer.to, filter)
      if (from) from.gold = from.gold.minus(transfer.value)
      if (to) to.gold = to.gold.plus(transfer.value)
    }
  }

  const blockRange = { fromBlock: blockNumber, toBlock: blockNumber }
  const lockedGold = await kit.contracts.getLockedGold()
  const goldLocked = (await lockedGold.getPastEvents('GoldLocked', blockRange)).map(
    (e: EventLog) => ({
      account: e.returnValues.account,
      value: valueToBigNumber(e.returnValues.value),
    })
  )
  for (const locked of goldLocked) {
    const account = getAccount(ret, locked.account, filter)
    // For lock() the gold was debited from account.gold by cgldTransferTracer
    if (account) account.lockedGold = account.lockedGold.plus(locked.value)
    // Can't distuinguish LockedGold lock() and relock() only from logs
    // await pendingWithdrawls = lockedGold.getPendingWithdrawls(account)
    // await sumPendingWithdrals =
  }

  const goldUnlocked = (await lockedGold.getPastEvents('GoldUnlocked', blockRange)).map(
    (e: EventLog) => ({
      account: e.returnValues.account,
      value: valueToBigNumber(e.returnValues.value),
      available: valueToBigNumber(e.returnValues.available),
    })
  )
  for (const unlocked of goldUnlocked) {
    const account = getAccount(ret, unlocked.account, filter)
    if (account)
      account.lockedGoldPendingWithdrawl = account.lockedGoldPendingWithdrawl.plus(unlocked.value)
  }

  const goldWithdrawn = (await lockedGold.getPastEvents('GoldWithdrawn', blockRange)).map(
    (e: EventLog) => ({
      account: e.returnValues.account,
      value: valueToBigNumber(e.returnValues.value),
    })
  )
  for (const withdrawn of goldWithdrawn) {
    // Gold has already been credited by cgldTransferTracer
    const account = getAccount(ret, withdrawn.account, filter)
    if (account)
      account.lockedGoldPendingWithdrawl = account.lockedGoldPendingWithdrawl.minus(withdrawn.value)
  }

  const election = await kit.contracts.getElection()
  const voteCast = (await election.getPastEvents('ValidatorGroupVoteCast', blockRange)).map(
    (e: EventLog) => ({
      account: e.returnValues.account,
      group: e.returnValues.group,
      value: valueToBigNumber(e.returnValues.value),
    })
  )
  for (const vote of voteCast) {
    const account = getAccount(ret, vote.account, filter)
    if (account) account.pendingVotes = account.pendingVotes.plus(vote.value)
  }

  const voteActivated = (
    await election.getPastEvents('ValidatorGroupVoteActivated', blockRange)
  ).map((e: EventLog) => ({
    account: e.returnValues.account,
    group: e.returnValues.group,
    value: valueToBigNumber(e.returnValues.value),
  }))
  for (const vote of voteActivated) {
    const account = getAccount(ret, vote.account, filter)
    // needs conversion to units
    if (account)
      account.activeVoteUnits[vote.group] = (
        account.activeVoteUnits[vote.group] || new BigNumber(0)
      ).plus(vote.value)
  }

  const voteRevoked = (await election.getPastEvents('ValidatorGroupVoteRevoked', blockRange)).map(
    (e: EventLog) => ({
      account: e.returnValues.account,
      group: e.returnValues.group,
      value: valueToBigNumber(e.returnValues.value),
    })
  )
  for (const vote of voteRevoked) {
    const account = getAccount(ret, vote.account, filter)
    if (account) account.lockedGold = account.lockedGold.plus(vote.value)
  }

  // StableToken.creditTo and StableToken.debitFrom should emit a Transfer event like StableToken._mint
  const stableTokenName = 'cUSD'
  const stableToken = await kit.contracts.getStableToken()
  const stableTransfers = (await stableToken.getPastEvents('Transfer', blockRange)).map(
    (e: EventLog) => ({
      from: e.returnValues.from,
      to: e.returnValues.to,
      value: valueToBigNumber(e.returnValues.value),
    })
  )
  for (const transfer of stableTransfers) {
    const from = getAccount(ret, transfer.from, filter)
    const to = getAccount(ret, transfer.to, filter)
    // needs event change to distuinguish StableToken instances from only logs
    // needs conversion to units
    if (from)
      from.tokenUnits[stableTokenName] = (
        from.tokenUnits[stableTokenName] || new BigNumber(0)
      ).minus(transfer.value)
    if (to)
      to.tokenUnits[stableTokenName] = (to.tokenUnits[stableTokenName] || new BigNumber(0)).plus(
        transfer.value
      )
  }

  // ReleaseGold

  // Epoch rewards

  // Slashing

  return ret
}

describe('tracer tests', () => {
  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
  const FromAddress = validatorAddress
  const ToAddress = '0xbBae99F0E1EE565404465638d40827b54D343638'
  /*const FromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
  const DEF_FROM_PK = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'
  const FeeRecipientAddress = '0x4f5f8a3f45d179553e7b95119ce296010f50f6f1'*/
  const TransferAmount: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))

  const gethConfig: GethRunConfig = {
    runPath: TMP_PATH,
    networkId: 1101,
    network: 'local',
    migrate: true,
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
      },
      {
        name: 'validator1',
        validating: true,
        syncmode: 'full',
        port: 30305,
        rpcport: 8547,
      },
      {
        name: 'validator2',
        validating: true,
        syncmode: 'full',
        port: 30307,
        rpcport: 8549,
      },
    ],
    migrationOverrides: {
      lockedGold: {
        unlockingPeriod: 1,
      },
      exchange: {
        minimumReports: 0,
        frozen: false,
      },
    },
  }

  const context: any = getContext(gethConfig)
  let kit: ContractKit
  let goldToken: GoldTokenWrapper

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(async function(this: any) {
    this.timeout(0)
    await context.hooks.after()
    //await sleep(1000000)
  })

  const restart = async () => {
    await context.hooks.restart()
    kit = newKit('http://localhost:8545')
    kit.defaultAccount = validatorAddress
    goldToken = await kit.contracts.getGoldToken()

    console.info('AllContracts')
    for (const contract of AllContracts) {
      try {
        const addr = await kit.registry.addressFor(contract)
        console.info(`${contract} = ${addr}`)
      } catch (error) {
        console.info(error)
      }
    }

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    // Assuming empty password
    await kit.web3.eth.personal.unlockAccount(validatorAddress, '', 1000000)

    // Give the account we will send transfers as sufficient gold and dollars.
    if (FromAddress != validatorAddress) {
      const startBalance = TransferAmount.times(500)
      const resDollars = await transferCeloDollars(validatorAddress, FromAddress, startBalance)
      const resGold = await transferCeloGold(validatorAddress, FromAddress, startBalance)
      await Promise.all([resDollars.waitReceipt(), resGold.waitReceipt()])
    }
  }

  const transferCeloGold = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: {
      gas?: number
      gasPrice?: string
      feeCurrency?: string
      gatewayFeeRecipient?: string
      gatewayFee?: string
    } = {}
  ) => {
    const res = await kit.sendTransaction({
      from: fromAddress,
      to: toAddress,
      value: amount.toString(),
      ...txOptions,
    })
    return res
  }

  const transferCeloDollars = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: {
      gas?: number
      gasPrice?: string
      feeCurrency?: string
      gatewayFeeRecipient?: string
      gatewayFee?: string
    } = {}
  ) => {
    const kitStableToken = await kit.contracts.getStableToken()
    const res = await kitStableToken.transfer(toAddress, amount.toString()).send({
      from: fromAddress,
      ...txOptions,
    })

    return res
  }

  const testTransferGold = (
    name: string,
    transferFn: () => Promise<TransactionReceipt>,
    goldGasCurrency: boolean = true
  ) => {
    let trackBalances: Record<Address, AccountAssets>
    let fromInitialBalance: BigNumber
    let fromFinalBalance: BigNumber
    let toInitialBalance: BigNumber
    let toFinalBalance: BigNumber
    let receipt: TransactionReceipt
    let txn: any

    describe(`transfer cGLD: ${name}`, () => {
      before(async function(this: any) {
        this.timeout(0)
        fromInitialBalance = await goldToken.balanceOf(FromAddress)
        toInitialBalance = await goldToken.balanceOf(ToAddress)
        receipt = await transferFn()
        receipt = await kit.web3.eth.getTransactionReceipt(receipt.transactionHash)
        txn = await kit.web3.eth.getTransaction(receipt.transactionHash)
        fromFinalBalance = await goldToken.balanceOf(FromAddress)
        toFinalBalance = await goldToken.balanceOf(ToAddress)
        trackBalances = await trackTransfers(kit, receipt.blockNumber)
        //console.info(`${name} receipt`)
        //console.info(receipt)
        //console.info(`${name} trackBalances`)
        //console.info(trackBalances)
        //console.info('${name} txn')
        //console.info(txn)
      })

      it(`balanceOf should increment the receiver's balance by the transfer amount`, () =>
        assertEqualBN(toFinalBalance.minus(toInitialBalance), new BigNumber(TransferAmount)))
      it(`balanceOf should decrement the sender's balance by the transfer amount`, () => {
        console.info(`gasUsed=${receipt.gasUsed}, gasPrice=${txn.gasPrice}`)
        assertEqualBN(
          fromFinalBalance.minus(fromInitialBalance),
          new BigNumber(-TransferAmount).minus(
            goldGasCurrency
              ? new BigNumber(receipt.gasUsed).times(new BigNumber(txn.gasPrice))
              : new BigNumber(0)
          )
        )
      })
      it(`cGLD tracer should increment the receiver's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(ToAddress)].gold,
          new BigNumber(TransferAmount)
        ))
      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(FromAddress)].gold,
          new BigNumber(-TransferAmount)
        ))
    })
  }

  describe('Tracer tests', () => {
    before(async function() {
      this.timeout(0)
      await restart()
    })

    testTransferGold('normal', async () => {
      const txResult = await transferCeloGold(FromAddress, ToAddress, TransferAmount)
      return txResult.waitReceipt()
    })

    testTransferGold(
      'with feeCurrency cUSD',
      async () => {
        const feeCurrency = await kit.registry.addressFor(CeloContract.StableToken)
        const txResult = await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
          feeCurrency,
        })
        return txResult.waitReceipt()
      },
      false
    )

    describe(`GoldToken.transfer`, () => {
      let trackBalances: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const tx = await goldToken.transfer(ToAddress, TransferAmount.toFixed())
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackBalances = await trackTransfers(kit, receipt.blockNumber)
      })

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(FromAddress)].gold,
          new BigNumber(-TransferAmount)
        ))
    })

    describe(`Locking gold`, () => {
      let trackBalances: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const lockedGold = await kit.contracts.getLockedGold()
        const tx = await lockedGold.lock()
        const txResult = await tx.send({ value: TransferAmount.toFixed() })
        receipt = await txResult.waitReceipt()
        trackBalances = await trackTransfers(kit, receipt.blockNumber)
      })

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(FromAddress)].gold,
          new BigNumber(-TransferAmount)
        ))
    })

    describe(`Unlocking gold`, () => {
      let trackBalances: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const lockedGold = await kit.contracts.getLockedGold()
        const tx = await lockedGold.unlock(TransferAmount)
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackBalances = await trackTransfers(kit, receipt.blockNumber)
      })

      it(`cGLD tracer should increment the sender's pending withdrawls by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(FromAddress)].lockedGoldPendingWithdrawl,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Withdrawing unlocked gold`, () => {
      let trackBalances: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        // wait for 1 second unlocking period to elapse
        await sleep(3)
        const lockedGold = await kit.contracts.getLockedGold()
        const tx = await lockedGold.withdraw(0)
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackBalances = await trackTransfers(kit, receipt.blockNumber)
        //console.info(`Withdraw receipt`)
        //console.info(receipt)
      })

      it(`cGLD tracer should increment the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(FromAddress)].gold,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Exchanging gold for tokens`, () => {
      let trackBalances: Record<Address, AccountAssets>
      let receipt: TransactionReceipt
      let reserve: ReserveWrapper

      before(async function(this: any) {
        this.timeout(0)
        reserve = await kit.contracts.getReserve()
        const exchange = await kit.contracts.getExchange()
        const approveTx = await goldToken.approve(exchange.address, TransferAmount.toFixed())
        const approveTxRes = await approveTx.send()
        await approveTxRes.waitReceipt()

        const tx = await exchange.exchange(TransferAmount, 1, true)
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackBalances = await trackTransfers(kit, receipt.blockNumber)
        //console.info(`Exchange gold receipt`)
        //console.info(receipt)
      })

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(FromAddress)].gold,
          new BigNumber(-TransferAmount)
        ))

      it(`cGLD tracer should increment the reserve's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(reserve.address)].gold,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Exchanging tokens for gold`, () => {
      let trackBalances: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const exchange = await kit.contracts.getExchange()
        const quote = (await exchange.quoteGoldBuy(TransferAmount)).plus(1)

        const stableToken = await kit.contracts.getStableToken()
        const approveTx = await stableToken.approve(exchange.address, quote.toFixed())
        const approveTxRes = await approveTx.send()
        await approveTxRes.waitReceipt()

        const tx = await exchange.exchange(quote, 1, false)
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackBalances = await trackTransfers(kit, receipt.blockNumber)
        //console.info(`Exchange token receipt`)
        //console.info(receipt)
      })

      it(`cGLD tracer should increment the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(FromAddress)].gold,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Deploying release gold`, () => {
      before(async function(this: any) {
        this.timeout(0)
        //const startBlockNumber = await this.web3.eth.getBlockNumber()
        const args = [
          '--cwd',
          `${MonorepoRoot}/packages/protocol`,
          'run',
          'truffle',
          'exec',
          `${MonorepoRoot}/packages/protocol/scripts/truffle/deploy_release_contracts.js`,
          '--network',
          'testing',
          '--start_gold',
          '50',
          '--grants',
          `${MonorepoRoot}/packages/protocol/scripts/truffle/releaseGoldContracts.json`,
          '--output_file',
          '${TMP_PATH}/releaseGold.txt',
          '--yesreally',
        ]
        await spawnCmdWithExitOnFailure('yarn', args)
        //const endBlockNumber = await this.web3.eth.getBlockNumber()
      })
    })

    describe(`Deploying TestContract`, () => {
      let testContract: any
      const txOptions = {
        from: FromAddress,
        gas: 1500000,
      }

      before(async function(this: any) {
        this.timeout(0)
        const contractFile = `${TMP_PATH}/testContract.sol`
        const outDir = `${TMP_PATH}/testContract.out`
        fs.writeFileSync(contractFile, testContractSource)
        await spawnCmdWithExitOnFailure('../../node_modules/solc/solcjs', [
          '--bin',
          contractFile,
          '-o',
          outDir,
        ])
        await spawnCmdWithExitOnFailure('../../node_modules/solc/solcjs', [
          '--abi',
          contractFile,
          '-o',
          outDir,
        ])
        const bytecode = fs.readFileSync(`${outDir}/_tmp_e2e_testContract_sol_TestContract.bin`)
        const abi = JSON.parse(
          fs.readFileSync(`${outDir}/_tmp_e2e_testContract_sol_TestContract.abi`).toString()
        )
        const contract = new kit.web3.eth.Contract(abi)
        const testContractTx = await contract.deploy({ data: '0x' + bytecode })
        testContract = await testContractTx.send(txOptions)
      })

      testTransferGold('with TestContract.transfer', async () => {
        const tx = await testContract.methods.transfer(ToAddress)
        return tx.send({ ...txOptions, value: TransferAmount.toFixed() })
      })

      testTransferGold('with TestContract.transferThenIgnoreRevert', async () => {
        const tx = await testContract.methods.transferThenIgnoreRevert(ToAddress)
        return tx.send({ ...txOptions, value: TransferAmount.toFixed() })
      })

      testTransferGold('with TestContract.selfDestruct', async () => {
        const tx = await testContract.methods.selfDestruct(ToAddress)
        return tx.send({ ...txOptions, value: TransferAmount.toFixed() })
      })
    })
  })
})
