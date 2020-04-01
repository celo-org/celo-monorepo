import { CeloContract, ContractKit, newKit } from '@celo/contractkit'
import { AllContracts } from '@celo/contractkit/lib/base'
import { traceBlock } from '@celo/contractkit/lib/utils/web3-utils'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { ReserveWrapper } from '@celo/contractkit/lib/wrappers/Reserve'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { Address, normalizeAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import fs from 'fs'
import Web3 from 'web3'
import { EventLog, TransactionReceipt } from 'web3-core'
import { Contract } from 'web3-eth-contract'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { spawnCmdWithExitOnFailure } from '../lib/utils'
import { getContext, MonorepoRoot, sleep } from './utils'

const TMP_PATH = '/tmp/e2e'

const testContractSource = `
pragma solidity ^0.5.8;

contract TestContractChild {
  event Constructed(address from);

  constructor() public payable {
    emit Constructed(msg.sender);
  }
}

contract TestContract {
  event Constructed(address from);
  event Destructed(address to);
  event Reverted();

  TestContractChild public child;

  constructor() public payable {
    emit Constructed(msg.sender);
  }

  function transfer(address payable to) external payable returns (bool) {
    to.transfer(msg.value);
    return true;
  }

  function transferThenRevert(address payable to) external payable returns (bool) {
    to.transfer(msg.value);
    revert('transferThenRevert');
  }
  
  function nestedTransferThenRevert(address payable to) external payable returns (bool) {
    bool success;
    (success,) = address(this).call.value(msg.value)(abi.encodeWithSignature("transferThenRevert(address)", to));
    return success;
  }

  function transferThenIgnoreRevert(address payable to) external payable returns (bool) {
    to.transfer(msg.value);
    bool success;
    (success,) = address(this).call(abi.encodeWithSignature("alwaysRevert()"));
    return success;
  }

  function alwaysRevert() public {
    emit Reverted();
    revert('alwaysRevert');
  }

  function createChild() external payable {
    child = (new TestContractChild).value(msg.value)();
  }

  function selfDestruct(address payable to) external payable {
    emit Destructed(msg.sender);
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

// tslint:disable-next-line:max-classes-per-file
class AccountAssets extends DerivedAccountAssets {
  gold: BigNumber
  releaseGold: Record<Address, ReleaseGoldAssets>

  constructor() {
    super()
    this.gold = new BigNumber(0)
    this.releaseGold = {}
  }
}

function getAccountAssets(
  accounts: Record<Address, AccountAssets>,
  accountAddress: Address,
  filter: boolean
): AccountAssets | undefined {
  const address = normalizeAddress(accountAddress || '')
  if (filter && !(address in accounts)) {
    return undefined
  }
  return accounts[address] || (accounts[address] = new AccountAssets())
}

async function trackAssetTransfers(
  kit: ContractKit,
  blockNumber: number,
  assets?: Record<Address, AccountAssets>,
  filter: boolean = false,
  filterTracerStatus: string = 'success'
): Promise<Record<Address, AccountAssets>> {
  const ret = assets || {}

  const goldTransfers = await traceBlock(kit.web3, blockNumber, 'cgldTransferTracer')
  for (const transaction of goldTransfers) {
    for (const transfer of transaction.transfers) {
      if (filterTracerStatus && transfer.status !== filterTracerStatus) {
        continue
      }
      const from = getAccountAssets(ret, transfer.from, filter)
      const to = getAccountAssets(ret, transfer.to, filter)
      if (from) {
        from.gold = from.gold.minus(transfer.value)
      }
      if (to) {
        to.gold = to.gold.plus(transfer.value)
      }
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
    const account = getAccountAssets(ret, locked.account, filter)
    // For lock() the gold was debited from account.gold by cgldTransferTracer
    if (account) {
      account.lockedGold = account.lockedGold.plus(locked.value)
      // Can't distuinguish LockedGold lock() and relock() only from logs
      // await pendingWithdrawls = lockedGold.getPendingWithdrawls(account)
      // await sumPendingWithdrals =
    }
  }

  const goldUnlocked = (await lockedGold.getPastEvents('GoldUnlocked', blockRange)).map(
    (e: EventLog) => ({
      account: e.returnValues.account,
      value: valueToBigNumber(e.returnValues.value),
      available: valueToBigNumber(e.returnValues.available),
    })
  )
  for (const unlocked of goldUnlocked) {
    const account = getAccountAssets(ret, unlocked.account, filter)
    if (account) {
      account.lockedGoldPendingWithdrawl = account.lockedGoldPendingWithdrawl.plus(unlocked.value)
    }
  }

  const goldWithdrawn = (await lockedGold.getPastEvents('GoldWithdrawn', blockRange)).map(
    (e: EventLog) => ({
      account: e.returnValues.account,
      value: valueToBigNumber(e.returnValues.value),
    })
  )
  for (const withdrawn of goldWithdrawn) {
    // Gold has already been credited by cgldTransferTracer
    const account = getAccountAssets(ret, withdrawn.account, filter)
    if (account) {
      account.lockedGoldPendingWithdrawl = account.lockedGoldPendingWithdrawl.minus(withdrawn.value)
    }
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
    const account = getAccountAssets(ret, vote.account, filter)
    if (account) {
      account.pendingVotes = account.pendingVotes.plus(vote.value)
    }
  }

  const voteActivated = (
    await election.getPastEvents('ValidatorGroupVoteActivated', blockRange)
  ).map((e: EventLog) => ({
    account: e.returnValues.account,
    group: e.returnValues.group,
    value: valueToBigNumber(e.returnValues.value),
  }))
  for (const vote of voteActivated) {
    const account = getAccountAssets(ret, vote.account, filter)
    // needs conversion to units
    if (account) {
      account.activeVoteUnits[vote.group] = (
        account.activeVoteUnits[vote.group] || new BigNumber(0)
      ).plus(vote.value)
    }
  }

  const voteRevoked = (await election.getPastEvents('ValidatorGroupVoteRevoked', blockRange)).map(
    (e: EventLog) => ({
      account: e.returnValues.account,
      group: e.returnValues.group,
      value: valueToBigNumber(e.returnValues.value),
    })
  )
  for (const vote of voteRevoked) {
    const account = getAccountAssets(ret, vote.account, filter)
    if (account) {
      account.lockedGold = account.lockedGold.plus(vote.value)
    }
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
    const from = getAccountAssets(ret, transfer.from, filter)
    const to = getAccountAssets(ret, transfer.to, filter)
    // needs event change to distuinguish StableToken instances from only logs
    // needs conversion to units
    if (from) {
      from.tokenUnits[stableTokenName] = (
        from.tokenUnits[stableTokenName] || new BigNumber(0)
      ).minus(transfer.value)
    }
    if (to) {
      to.tokenUnits[stableTokenName] = (to.tokenUnits[stableTokenName] || new BigNumber(0)).plus(
        transfer.value
      )
    }
  }

  /*const epochNumber = await kit.getEpochNumberOfBlock(blockNumber)
  const prevBlockEpochNumber = await kit.getEpochNumberOfBlock(blockNumber - 1
  if (epochNumber !== prevBlockEpochNumber) {
    const validatorRewards = await validators.getValidatorRewards(epochNumber - 1)
    for (const reward of validatorRewards) {
      const voterReward = await election.getVoterRewards(addr, epochNumber - 1)
    }
  }*/

  // ReleaseGold

  // Slashing

  return ret
}

function assertEqualBN(value: BigNumber, expected: BigNumber) {
  assert.equal(value.toString(), expected.toString())
}

const transferCeloGold = async (
  kit: ContractKit,
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
  kit: ContractKit,
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

export const logAllContracts = async (kit: ContractKit) => {
  console.info('AllContracts')
  for (const contract of AllContracts) {
    try {
      const addr = await kit.registry.addressFor(contract)
      console.info(`${contract} = ${addr}`)
    } catch (error) {
      console.info(error)
    }
  }
}

describe('tracer tests', () => {
  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
  const FromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
  const ToAddress = '0xbBae99F0E1EE565404465638d40827b54D343638'
  const DEF_FROM_PK = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'
  const TransferAmount: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))

  const gethConfig: GethRunConfig = {
    runPath: TMP_PATH,
    networkId: 1101,
    network: 'local',
    migrate: true,
    // verbosity: 5,
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
        wsport: 8546,
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
  let stableToken: StableTokenWrapper

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(async function(this: any) {
    this.timeout(0)
    await context.hooks.after()
    // await sleep(1000000)
  })

  const restart = async () => {
    await context.hooks.restart()
    kit = newKit('http://localhost:8545')
    kit.defaultAccount = validatorAddress
    goldToken = await kit.contracts.getGoldToken()
    stableToken = await kit.contracts.getStableToken()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    // Assuming empty password
    await kit.web3.eth.personal.unlockAccount(validatorAddress, '', 1000000)

    // Give the account we will send transfers as sufficient gold and dollars.
    const startBalance = TransferAmount.times(500)
    const resDollars = await transferCeloDollars(kit, validatorAddress, FromAddress, startBalance)
    const resGold = await transferCeloGold(kit, validatorAddress, FromAddress, startBalance)
    await Promise.all([resDollars.waitReceipt(), resGold.waitReceipt()])

    // Unlock FromAddress account
    await kit.web3.eth.personal.importRawKey(DEF_FROM_PK, '')
    await kit.web3.eth.personal.unlockAccount(FromAddress, '', 1000000)
    kit.defaultAccount = FromAddress

    // Create account for FromAddress
    const accounts = await kit.contracts.getAccounts()
    const createAccountTx = await accounts.createAccount()
    const txResult = await createAccountTx.send()
    await txResult.waitReceipt()
  }

  const testTransferGold = (name: string, transferFn: () => Promise<any>) => {
    let fromAddress: string
    let toAddress: string
    let sendAmount: BigNumber
    let receiveAmount: BigNumber
    let sentBalance: BigNumber
    let receivedBalance: BigNumber
    let goldGasCurrency: boolean
    let fromInitialBalance: BigNumber
    let fromFinalBalance: BigNumber
    let toInitialBalance: BigNumber
    let toFinalBalance: BigNumber
    let receipt: TransactionReceipt
    let txn: any
    let trackAssets: Record<Address, AccountAssets>
    let filterTracerStatus: string

    describe(`transfer cGLD: ${name}`, () => {
      before(async function(this: any) {
        this.timeout(0)

        const transferResult = await transferFn()
        fromAddress = transferResult.fromAddress || FromAddress
        toAddress = transferResult.toAddress || ToAddress
        sendAmount = transferResult.sendAmount || TransferAmount
        receiveAmount = transferResult.receiveAmount || TransferAmount
        sentBalance = transferResult.sentBalance || sendAmount
        receivedBalance = transferResult.receivedBalance || receiveAmount
        goldGasCurrency =
          transferResult.goldGasCurrency !== undefined ? transferResult.goldGasCurrency : true
        filterTracerStatus = transferResult.filterTracerStatus || 'success'

        receipt = await kit.web3.eth.getTransactionReceipt(transferResult.transactionHash)
        txn = await kit.web3.eth.getTransaction(receipt.transactionHash)
        fromInitialBalance = new BigNumber(
          await kit.web3.eth.getBalance(fromAddress, txn.blockNumber - 1)
        )
        toInitialBalance = new BigNumber(
          await kit.web3.eth.getBalance(toAddress, txn.blockNumber - 1)
        )
        fromFinalBalance = new BigNumber(
          await kit.web3.eth.getBalance(fromAddress, txn.blockNumber)
        )
        toFinalBalance = new BigNumber(await kit.web3.eth.getBalance(toAddress, txn.blockNumber))
        trackAssets = await trackAssetTransfers(
          kit,
          receipt.blockNumber,
          undefined,
          false,
          filterTracerStatus
        )
        // console.info(`${name} receipt`)
        // console.info(receipt)
        // console.info(`${name} trackAssets`)
        // console.info(trackAssets)
        // console.info(`${name} txn`)
        // console.info(txn)
        // console.info(`${name} from balance delta: ` + fromFinalBalance.minus(fromInitialBalance).toFixed())
      })

      it(`balanceOf should increment the receiver's balance by the transfer amount`, () =>
        assertEqualBN(toFinalBalance.minus(toInitialBalance), new BigNumber(receivedBalance)))

      it(`balanceOf should decrement the sender's balance by the transfer amount`, () => {
        console.info(`gasUsed=${receipt.gasUsed}, gasPrice=${txn.gasPrice}`)
        assertEqualBN(
          fromFinalBalance.minus(fromInitialBalance),
          new BigNumber(-sentBalance).minus(
            goldGasCurrency
              ? new BigNumber(receipt.gasUsed).times(new BigNumber(txn.gasPrice))
              : new BigNumber(0)
          )
        )
      })

      it(`cGLD tracer should increment the receiver's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(toAddress)]?.gold || new BigNumber(0),
          new BigNumber(receiveAmount)
        ))

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(fromAddress)]?.gold || new BigNumber(0),
          new BigNumber(-sendAmount)
        ))
    })
  }

  const testTransferDollars = (name: string, transferFn: () => Promise<any>) => {
    let fromAddress: string
    let toAddress: string
    let sendAmount: BigNumber
    let receiveAmount: BigNumber
    let sentBalance: BigNumber
    let receivedBalance: BigNumber
    let goldGasCurrency: boolean
    let fromInitialBalance: BigNumber
    let fromFinalBalance: BigNumber
    let toInitialBalance: BigNumber
    let toFinalBalance: BigNumber
    let receipt: TransactionReceipt
    let txn: any
    let trackAssets: Record<Address, AccountAssets>

    describe(`transfer cUSD: ${name}`, () => {
      before(async function(this: any) {
        this.timeout(0)

        const transferResult = await transferFn()
        fromAddress = transferResult.fromAddress || FromAddress
        toAddress = transferResult.toAddress || ToAddress
        sendAmount = transferResult.sendAmount || TransferAmount
        receiveAmount = transferResult.receiveAmount || TransferAmount
        sentBalance = transferResult.sentBalance || sendAmount
        receivedBalance = transferResult.receivedBalance || receiveAmount
        goldGasCurrency =
          transferResult.goldGasCurrency !== undefined ? transferResult.goldGasCurrency : true

        receipt = await kit.web3.eth.getTransactionReceipt(transferResult.transactionHash)
        txn = await kit.web3.eth.getTransaction(receipt.transactionHash)
        fromInitialBalance = new BigNumber(
          await stableToken.balanceOf(fromAddress, txn.blockNumber - 1)
        )
        toInitialBalance = new BigNumber(
          await stableToken.balanceOf(toAddress, txn.blockNumber - 1)
        )
        fromFinalBalance = new BigNumber(await stableToken.balanceOf(fromAddress, txn.blockNumber))
        toFinalBalance = new BigNumber(await stableToken.balanceOf(toAddress, txn.blockNumber))
        trackAssets = await trackAssetTransfers(kit, receipt.blockNumber)
        // console.info(`${name} receipt`)
        // console.info(receipt)
        // console.info(`${name} trackAssets`)
        // console.info(trackAssets)
        // console.info(`${name} txn`)
        // console.info(txn)
        // console.info(`${name} from balance delta: ` + fromFinalBalance.minus(fromInitialBalance).toFixed())
      })

      it(`balanceOf should increment the receiver's balance by the transfer amount`, () =>
        assertEqualBN(toFinalBalance.minus(toInitialBalance), new BigNumber(receivedBalance)))

      it(`balanceOf should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          fromFinalBalance.minus(fromInitialBalance),
          new BigNumber(-sentBalance).minus(
            goldGasCurrency
              ? new BigNumber(0)
              : new BigNumber(receipt.gasUsed).times(new BigNumber(txn.gasPrice))
          )
        ))

      it(`cGLD tracer should increment the receiver's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(toAddress)].tokenUnits.cUSD,
          new BigNumber(receiveAmount)
        ))

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(fromAddress)].tokenUnits.cUSD,
          new BigNumber(-sentBalance).minus(
            goldGasCurrency
              ? new BigNumber(0)
              : new BigNumber(receipt.gasUsed).times(new BigNumber(txn.gasPrice))
          )
        ))
    })
  }

  describe('Tracer tests', () => {
    before(async function() {
      this.timeout(0)
      await restart()
    })

    testTransferGold('normal', async () => {
      const txResult = await transferCeloGold(kit, FromAddress, ToAddress, TransferAmount)
      const receipt = await txResult.waitReceipt()
      return { transactionHash: receipt.transactionHash }
    })

    testTransferGold('with feeCurrency cUSD', async () => {
      const feeCurrency = await kit.registry.addressFor(CeloContract.StableToken)
      const txResult = await transferCeloGold(kit, FromAddress, ToAddress, TransferAmount, {
        feeCurrency,
      })
      const receipt = await txResult.waitReceipt()
      return {
        goldGasCurrency: false,
        transactionHash: receipt.transactionHash,
      }
    })

    describe(`GoldToken.transfer`, () => {
      let trackAssets: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const tx = await goldToken.transfer(ToAddress, TransferAmount.toFixed())
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackAssets = await trackAssetTransfers(kit, receipt.blockNumber)
      })

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(FromAddress)].gold,
          new BigNumber(-TransferAmount)
        ))
    })

    describe(`Locking gold`, () => {
      let trackAssets: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const lockedGold = await kit.contracts.getLockedGold()
        const tx = await lockedGold.lock()
        const txResult = await tx.send({ value: TransferAmount.toFixed() })
        receipt = await txResult.waitReceipt()
        trackAssets = await trackAssetTransfers(kit, receipt.blockNumber)
      })

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(FromAddress)].gold,
          new BigNumber(-TransferAmount)
        ))
    })

    describe(`Unlocking gold`, () => {
      let trackAssets: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const lockedGold = await kit.contracts.getLockedGold()
        const tx = await lockedGold.unlock(TransferAmount)
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackAssets = await trackAssetTransfers(kit, receipt.blockNumber)
      })

      it(`cGLD tracer should increment the sender's pending withdrawls by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(FromAddress)].lockedGoldPendingWithdrawl,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Withdrawing unlocked gold`, () => {
      let trackAssets: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        // wait for 1 second unlocking period to elapse
        await sleep(3)
        const lockedGold = await kit.contracts.getLockedGold()
        const tx = await lockedGold.withdraw(0)
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackAssets = await trackAssetTransfers(kit, receipt.blockNumber)
        // console.info(`Withdraw receipt`)
        // console.info(receipt)
      })

      it(`cGLD tracer should increment the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(FromAddress)].gold,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Exchanging gold for tokens`, () => {
      let trackAssets: Record<Address, AccountAssets>
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
        trackAssets = await trackAssetTransfers(kit, receipt.blockNumber)
        // console.info(`Exchange gold receipt`)
        // console.info(receipt)
      })

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(FromAddress)].gold,
          new BigNumber(-TransferAmount)
        ))

      it(`cGLD tracer should increment the reserve's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(reserve.address)].gold,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Exchanging tokens for gold`, () => {
      let trackAssets: Record<Address, AccountAssets>
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const exchange = await kit.contracts.getExchange()
        const quote = (await exchange.quoteGoldBuy(TransferAmount)).plus(1)

        const approveTx = await stableToken.approve(exchange.address, quote.toFixed())
        const approveTxRes = await approveTx.send()
        await approveTxRes.waitReceipt()

        const tx = await exchange.exchange(quote, 1, false)
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackAssets = await trackAssetTransfers(kit, receipt.blockNumber)
        // console.info(`Exchange token receipt`)
        // console.info(receipt)
      })

      it(`cGLD tracer should increment the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets[normalizeAddress(FromAddress)].gold,
          new BigNumber(TransferAmount)
        ))
    })

    testTransferDollars('normal', async () => {
      const txResult = await transferCeloDollars(kit, FromAddress, ToAddress, TransferAmount)
      const receipt = await txResult.waitReceipt()
      return { transactionHash: receipt.transactionHash }
    })

    testTransferDollars('with feeCurrency cUSD', async () => {
      const feeCurrency = await kit.registry.addressFor(CeloContract.StableToken)
      const txResult = await transferCeloDollars(kit, FromAddress, ToAddress, TransferAmount, {
        feeCurrency,
      })
      const receipt = await txResult.waitReceipt()
      return {
        goldGasCurrency: false,
        transactionHash: receipt.transactionHash,
      }
    })

    describe(`Deploying release gold`, () => {
      before(async function(this: any) {
        this.timeout(0)
        // const startBlockNumber = await this.web3.eth.getBlockNumber()
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
          `${TMP_PATH}/releaseGold.txt`,
          '--yesreally',
        ]
        await spawnCmdWithExitOnFailure('yarn', args)
        // const endBlockNumber = await this.web3.eth.getBlockNumber()
      })
    })

    describe(`Deploying TestContract`, () => {
      let testContract: Contract
      let testContractDeployTransactionHash: string
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
        testContract = await testContractTx.send(
          { ...txOptions, value: TransferAmount.toFixed() },
          (_: Error, transactionHash: string) =>
            (testContractDeployTransactionHash = transactionHash)
        )
        console.info(`deploy TestContract transaction hash: ${testContractDeployTransactionHash}`)
      })

      testTransferGold('with TestContract constructor', async () => ({
        transactionHash: testContractDeployTransactionHash,
        toAddress: testContract.options.address,
      }))

      testTransferGold('with TestContract.transfer', async () => {
        const tx = await testContract.methods.transfer(ToAddress)
        const receipt = await tx.send({ ...txOptions, value: TransferAmount.toFixed() })
        return { transactionHash: receipt.transactionHash }
      })

      testTransferGold('with TestContract.transferThenRevert', async () => {
        const tx = await testContract.methods.transferThenRevert(ToAddress)
        try {
          await tx.send({ ...txOptions, value: TransferAmount.toFixed() })
          throw new Error('Expected transaction to revert')
        } catch (e) {
          const text = e.toString()
          assert.equal(true, text.startsWith('Error: Transaction has been reverted by the EVM'))
          const txn = JSON.parse(text.substring(text.indexOf('{')))
          return {
            filterTracerStatus: 'revert',
            transactionHash: txn.transactionHash,
            sentBalance: new BigNumber(0),
            receivedBalance: new BigNumber(0),
          }
        }
      })

      testTransferGold(
        'with TestContract.nestedTransferThenRevert: check sent to contract',
        async () => {
          const tx = await testContract.methods.nestedTransferThenRevert(ToAddress)
          const receipt = await tx.send({ ...txOptions, value: TransferAmount.toFixed() })
          return {
            transactionHash: receipt.transactionHash,
            receiveAmount: new BigNumber(0),
          }
        }
      )

      testTransferGold(
        'with TestContract.nestedTransferThenRevert: check receive reverted',
        async () => {
          const tx = await testContract.methods.nestedTransferThenRevert(ToAddress)
          const receipt = await tx.send({ ...txOptions, value: TransferAmount.toFixed() })
          return {
            filterTracerStatus: 'revert',
            fromAddress: testContract.options.address,
            transactionHash: receipt.transactionHash,
            sentBalance: TransferAmount.multipliedBy(-1),
            receivedBalance: new BigNumber(0),
            goldGasCurrency: false,
          }
        }
      )

      testTransferGold('with TestContract.transferThenIgnoreRevert', async () => {
        const tx = await testContract.methods.transferThenIgnoreRevert(ToAddress)
        const receipt = await tx.send({ ...txOptions, value: TransferAmount.toFixed() })
        return { transactionHash: receipt.transactionHash }
      })

      testTransferGold('with TestContract.createChild', async () => {
        const tx = await testContract.methods.createChild()
        const receipt = await tx.send({ ...txOptions, value: TransferAmount.toFixed() })
        const testContractChildAddress = await testContract.methods.child().call({})
        return {
          toAddress: testContractChildAddress,
          transactionHash: receipt.transactionHash,
        }
      })

      testTransferGold('with TestContract.selfDestruct', async () => {
        const tx = await testContract.methods.selfDestruct(ToAddress)
        const receipt = await tx.send({ ...txOptions, value: TransferAmount.toFixed() })
        return {
          receiveAmount: TransferAmount.times(4),
          transactionHash: receipt.transactionHash,
        }
      })
    })

    const argv = require('minimist')(process.argv.slice(2))
    if (argv.localrosetta && typeof argv.localrosetta === 'string') {
      describe(`Rossetta tracer`, () => {
        it('Tracer driver should succeed', async function(this: any) {
          this.timeout(0)
          await spawnCmdWithExitOnFailure('go', ['run', './examples/tracer/tracer.go'], {
            cwd: argv.localrosetta,
          })
        })
      })
    }
  })
})
