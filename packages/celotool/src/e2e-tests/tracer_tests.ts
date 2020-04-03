import { CeloContract, ContractKit, newKit } from '@celo/contractkit'
import { AllContracts } from '@celo/contractkit/lib/base'
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { traceBlock } from '@celo/contractkit/lib/utils/web3-utils'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { ReserveWrapper } from '@celo/contractkit/lib/wrappers/Reserve'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { Address, normalizeAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import { EventLog, TransactionReceipt } from 'web3-core'
import { Contract } from 'web3-eth-contract'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { spawnCmdWithExitOnFailure } from '../lib/utils'
import {
  compileContract,
  deployReleaseGold,
  getContext,
  getRosettaContext,
  sleep,
  waitForBlock,
} from './utils'

const TMP_PATH = '/tmp/e2e'
const ValidatorAddress = normalizeAddress('0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95')
const ToAddress = normalizeAddress('0xbBae99F0E1EE565404465638d40827b54D343638')
const FromAddress = normalizeAddress('0x5409ed021d9299bf6814279a6a1411a7e866a631')
const FromPrivateKey = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'
const ReleaseGoldAddress = normalizeAddress('0x9CA2761bD9709449eF63d8aBa53EF0D4FF31cfEc')
const ReleaseGoldPrivateKey = '4f5fad325dba678797c74b936098e84aa14099c2a4a01ffedc795a5fa9ea65e3'
const TransferAmount: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))

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

const releaseGoldGrants = [
  {
    releaseStartTime: 'MAINNET+0',
    releaseCliffTime: 600,
    numReleasePeriods: 40,
    releasePeriod: 10,
    amountReleasedPerPeriod: 10,
    revocable: false,
    beneficiary: FromAddress,
    releaseOwner: ReleaseGoldAddress,
    refundAddress: '0x0000000000000000000000000000000000000000',
    subjectToLiquidityProvision: true,
    initialDistributionRatio: 1000,
    canValidate: true,
    canVote: true,
  },
]

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

// tslint:disable-next-line:max-classes-per-file
class Votes {
  votes: Record<Address, BigNumber>

  constructor() {
    this.votes = {}
  }
}

// tslint:disable-next-line:max-classes-per-file
class Globals {
  carbonOffsettingAddress: Address = ''
}

// tslint:disable-next-line:max-classes-per-file
class Assets {
  globals: Globals
  votes: Votes
  accounts: Record<Address, AccountAssets>

  constructor() {
    this.globals = new Globals()
    this.votes = new Votes()
    this.accounts = {}
  }
}

function getAccountAssets(
  assets: Assets,
  accountAddress: Address,
  filter: boolean
): AccountAssets | undefined {
  const address = normalizeAddress(accountAddress || '')
  if (filter && !(address in assets.accounts)) {
    return undefined
  }
  return assets.accounts[address] || (assets.accounts[address] = new AccountAssets())
}

async function trackAssetTransfers(
  kit: ContractKit,
  blockNumber: number,
  assets?: Assets,
  filter: boolean = false,
  filterTracerStatus: string = 'success'
): Promise<Assets> {
  const ret = assets || new Assets()

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
  const lockedGold = await kit._web3Contracts.getLockedGold()
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

  const election = await kit._web3Contracts.getElection()
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
  const stableToken = await kit._web3Contracts.getStableToken()
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

  const lockedGoldWrapper = await kit.contracts.getLockedGold()
  const epochNumber = await kit.getEpochNumberOfBlock(blockNumber)
  const slashed = await lockedGoldWrapper.getAccountsSlashed(epochNumber)
  for (const slash of slashed) {
    // can't tell if penalty was decremented from voting gold and/or locked gold
    const reporter = getAccountAssets(ret, slash.reporter, filter)
    if (reporter) {
      reporter.lockedGold = reporter.lockedGold.plus(slash.reward)
    }
  }

  const prevBlockEpochNumber = await kit.getEpochNumberOfBlock(blockNumber - 1)
  if (epochNumber !== prevBlockEpochNumber) {
    const validatorsWrapper = await kit.contracts.getValidators()
    const validatorRewards = await validatorsWrapper.getValidatorRewards(epochNumber - 1)
    for (const validatorReward of validatorRewards) {
      const validator = getAccountAssets(
        ret,
        normalizeAddress(validatorReward.validator.address),
        filter
      )
      if (validator) {
        validator.lockedGold = validator.lockedGold.plus(validatorReward.validatorPayment)
      }
      const group = getAccountAssets(ret, normalizeAddress(validatorReward.group.address), filter)
      if (group) {
        group.lockedGold = group.lockedGold.plus(validatorReward.groupPayment)
      }
    }

    const electionWrapper = await kit.contracts.getElection()
    const voterRewards = await electionWrapper.getGroupVoterRewards(epochNumber - 1)
    for (const voterReward of voterRewards) {
      const group = normalizeAddress(voterReward.group.address)
      const groupVotes = ret.votes.votes[group] || new BigNumber(0)
      ret.votes.votes[group] = groupVotes.plus(voterReward.groupVoterPayment)
    }
  }

  for (const accountAddress of Object.keys(ret.accounts)) {
    const account = ret.accounts[accountAddress]
    for (const address of Object.keys(account.releaseGold)) {
      const asset = account.releaseGold[address]
      const releaseGold = newReleaseGold(kit.web3, address)

      const created = (
        await releaseGold.getPastEvents('ReleaseGoldInstanceCreated', blockRange)
      ).map((e: EventLog) => ({
        beneficiary: normalizeAddress(e.returnValues.beneficiary),
        atAddress: normalizeAddress(e.returnValues.atAddress),
      }))
      for (const create of created) {
        assert.equal(create.beneficiary, FromAddress)
        const balance = await kit.web3.eth.getBalance(create.atAddress)
        asset.gold = asset.gold.plus(balance)
      }
    }
  }

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
  const rosettaContext: any = getRosettaContext()
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
    kit.defaultAccount = ValidatorAddress
    goldToken = await kit.contracts.getGoldToken()
    stableToken = await kit.contracts.getStableToken()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    // Assuming empty password
    await kit.web3.eth.personal.unlockAccount(ValidatorAddress, '', 1000000)

    const fundAccounts = [
      { address: FromAddress, privateKey: FromPrivateKey },
      { address: ReleaseGoldAddress, privateKey: ReleaseGoldPrivateKey },
    ]

    for (const fundAccount of fundAccounts) {
      // Give the account we will send transfers as sufficient gold and dollars.
      const startBalance = TransferAmount.times(500)
      const resDollars = await transferCeloDollars(
        kit,
        ValidatorAddress,
        fundAccount.address,
        startBalance
      )
      const resGold = await transferCeloGold(
        kit,
        ValidatorAddress,
        fundAccount.address,
        startBalance
      )
      await Promise.all([resDollars.waitReceipt(), resGold.waitReceipt()])

      // Unlock fundAccount.address account
      await kit.web3.eth.personal.importRawKey(fundAccount.privateKey, '')
      await kit.web3.eth.personal.unlockAccount(fundAccount.address, '', 1000000)

      // Create account for fundAccount.address
      kit.defaultAccount = fundAccount.address
      const accounts = await kit.contracts.getAccounts()
      const createAccountTx = await accounts.createAccount()
      const txResult = await createAccountTx.send()
      await txResult.waitReceipt()
    }

    kit.defaultAccount = FromAddress
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
    let trackAssets: Assets
    let filterTracerStatus: string

    describe(`transfer cGLD: ${name}`, () => {
      before(async function(this: any) {
        this.timeout(0)

        const transferResult = await transferFn()
        fromAddress = normalizeAddress(transferResult.fromAddress || FromAddress)
        toAddress = normalizeAddress(transferResult.toAddress || ToAddress)
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
          trackAssets.accounts[toAddress]?.gold || new BigNumber(0),
          new BigNumber(receiveAmount)
        ))

      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets.accounts[fromAddress]?.gold || new BigNumber(0),
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
    let trackAssets: Assets

    describe(`transfer cUSD: ${name}`, () => {
      before(async function(this: any) {
        this.timeout(0)

        const transferResult = await transferFn()
        fromAddress = normalizeAddress(transferResult.fromAddress || FromAddress)
        toAddress = normalizeAddress(transferResult.toAddress || ToAddress)
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

      it(`trackTransfers should increment the receiver's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets.accounts[toAddress].tokenUnits.cUSD,
          new BigNumber(receiveAmount)
        ))

      it(`trackTransfers should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets.accounts[fromAddress].tokenUnits.cUSD,
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

    testTransferGold('with GoldToken.transfer', async () => {
      const tx = await goldToken.transfer(ToAddress, TransferAmount.toFixed())
      const txResult = await tx.send()
      const receipt = await txResult.waitReceipt()
      return { transactionHash: receipt.transactionHash }
    })

    describe(`Locking gold`, () => {
      let trackAssets: Assets
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
        assertEqualBN(trackAssets.accounts[FromAddress].gold, new BigNumber(-TransferAmount)))
    })

    describe(`Unlocking gold`, () => {
      let trackAssets: Assets
      let receipt: TransactionReceipt

      before(async function(this: any) {
        this.timeout(0)
        const lockedGold = await kit.contracts.getLockedGold()
        const tx = await lockedGold.unlock(TransferAmount)
        const txResult = await tx.send()
        receipt = await txResult.waitReceipt()
        trackAssets = await trackAssetTransfers(kit, receipt.blockNumber)
      })

      it(`trackTransfers should increment the sender's pending withdrawls by the transfer amount`, () =>
        assertEqualBN(
          trackAssets.accounts[FromAddress].lockedGoldPendingWithdrawl,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Withdrawing unlocked gold`, () => {
      let trackAssets: Assets
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
        assertEqualBN(trackAssets.accounts[FromAddress].gold, new BigNumber(TransferAmount)))
    })

    describe(`Exchanging gold for tokens`, () => {
      let trackAssets: Assets
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
        assertEqualBN(trackAssets.accounts[FromAddress].gold, new BigNumber(-TransferAmount)))

      it(`cGLD tracer should increment the reserve's balance by the transfer amount`, () =>
        assertEqualBN(
          trackAssets.accounts[normalizeAddress(reserve.address)].gold,
          new BigNumber(TransferAmount)
        ))
    })

    describe(`Exchanging tokens for gold`, () => {
      let trackAssets: Assets
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
        assertEqualBN(trackAssets.accounts[FromAddress].gold, new BigNumber(TransferAmount)))
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

    describe(`Deploying TestContract`, () => {
      let testContract: Contract
      let testContractDeployTransactionHash: string
      const txOptions = {
        from: FromAddress,
        gas: 1500000,
      }

      before(async function(this: any) {
        this.timeout(0)
        const compiled = await compileContract('TestContract', testContractSource, TMP_PATH)
        const contract = new kit.web3.eth.Contract(compiled.abi)
        const testContractTx = await contract.deploy({ data: '0x' + compiled.bytecode })
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

    describe(`Deploying release gold`, () => {
      let releaseGold: any
      let trackAssets: Assets
      const startAmount = new BigNumber(Web3.utils.toWei('1', 'ether'))
      const fundAmount = new BigNumber(releaseGoldGrants[0].numReleasePeriods).times(
        Web3.utils.toWei(releaseGoldGrants[0].amountReleasedPerPeriod.toString(), 'ether')
      )

      before(async function(this: any) {
        this.timeout(0)
        const startBlockNumber = (await kit.web3.eth.getBlockNumber()) + 1
        await waitForBlock(kit.web3, startBlockNumber)
        releaseGoldGrants[0].releaseStartTime = new Date().toString()
        releaseGold = await deployReleaseGold(
          'testing',
          ReleaseGoldAddress,
          JSON.stringify(releaseGoldGrants),
          TMP_PATH
        )
        const endBlockNumber = await kit.web3.eth.getBlockNumber()
        console.info(`ReleaseGold deployed in blocks [${startBlockNumber}-${endBlockNumber}]`)
        trackAssets = new Assets()
        const account = getAccountAssets(trackAssets, FromAddress, false)
        if (account) {
          account.releaseGold[
            normalizeAddress(releaseGold[0].ProxyAddress)
          ] = new ReleaseGoldAssets()
        }
        for (let blockNumber = startBlockNumber; blockNumber <= endBlockNumber; blockNumber++) {
          trackAssets = await trackAssetTransfers(kit, blockNumber, trackAssets)
        }
        // console.info(trackAssets)
      })

      it('cGLD tracer should increment beneficiary by start amount', () =>
        assertEqualBN(trackAssets.accounts[FromAddress]?.gold, startAmount))

      it('cGLD tracer should increment ReleaseGold proxy by funding amount', () =>
        assertEqualBN(
          trackAssets.accounts[normalizeAddress(releaseGold[0].ProxyAddress)]?.gold,
          fundAmount
        ))

      it('cGLD tracer should decrement funder by total', () =>
        assertEqualBN(
          trackAssets.accounts[ReleaseGoldAddress]?.gold,
          fundAmount.plus(startAmount).times(-1)
        ))

      it('trackTransfers should increment beneficiary ReleaseGold', () =>
        assertEqualBN(
          trackAssets.accounts[FromAddress]?.releaseGold[
            normalizeAddress(releaseGold[0].ProxyAddress)
          ]?.gold,
          fundAmount
        ))
    })

    if (rosettaContext) {
      describe(`Rossetta`, () => {
        before(async function(this: any) {
          this.timeout(0)
          await rosettaContext.hooks.before()
        })

        it('Tracer driver should succeed', async function(this: any) {
          this.timeout(0)
          await spawnCmdWithExitOnFailure('go', ['run', './examples/tracer/tracer.go'], {
            cwd: rosettaContext.repoPath,
          })
        })
      })
    }
  })
})
