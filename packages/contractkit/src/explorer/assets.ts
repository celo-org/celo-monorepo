import { Address, normalizeAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { ContractKit } from '../kit'
import { traceBlock } from '../utils/web3-utils'

export class DerivedAccountAssets {
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

export class ReleaseGoldAssets extends DerivedAccountAssets {
  gold: BigNumber

  constructor() {
    super()
    this.gold = new BigNumber(0)
  }
}

export class AccountAssets extends DerivedAccountAssets {
  gold: BigNumber
  releaseGold: Record<Address, ReleaseGoldAssets>

  constructor() {
    super()
    this.gold = new BigNumber(0)
    this.releaseGold = {}
  }
}

export async function trackTransfers(
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
  for (const transfer of goldTransfers) {
    const fromAddress = normalizeAddress(transfer.from)
    const toAddress = normalizeAddress(transfer.to)
    if (filter && !(fromAddress in ret) && !(toAddress in ret)) continue
    const from = ret[fromAddress] || (ret[fromAddress] = new AccountAssets())
    const to = ret[toAddress] || (ret[toAddress] = new AccountAssets())
    from.gold = from.gold.minus(transfer.value)
    to.gold = to.gold.plus(transfer.value)
  }

  const lockedGold = await kit.contracts.getLockedGold()
  const goldLocked = await lockedGold.getGoldLockedEvents(blockNumber)
  for (const locked of goldLocked) {
    const account = ret[normalizeAddress(locked.account)]
    // For lock() the gold was debited from account.gold by cgld_transfer_tracer
    account.lockedGold = account.lockedGold.plus(locked.value)
    // Can't distuinguish LockedGold lock() and relock() only from logs
    // await pendingWithdrawls = lockedGold.getPendingWithdrawls(account)
    // await sumPendingWithdrals =
  }

  const goldUnlocked = await lockedGold.getGoldUnlockedEvents(blockNumber)
  for (const unlocked of goldUnlocked) {
    const account = ret[normalizeAddress(unlocked.account)]
    account.lockedGoldPendingWithdrawl = account.lockedGoldPendingWithdrawl.plus(unlocked.value)
  }

  const goldWithdrawn = await lockedGold.getGoldWithdrawnEvents(blockNumber)
  for (const withdrawn of goldWithdrawn) {
    const account = ret[normalizeAddress(withdrawn.account)]
    account.gold = account.gold.plus(withdrawn.value)
  }

  const election = await kit.contracts.getElection()
  const voteCast = await election.getValidatorGroupVoteCastEvents(blockNumber)
  for (const vote of voteCast) {
    const account = ret[normalizeAddress(vote.account)]
    account.pendingVotes = account.pendingVotes.plus(vote.value)
  }

  const voteActivated = await election.getValidatorGroupVoteActivatedEvents(blockNumber)
  for (const vote of voteActivated) {
    const account = ret[normalizeAddress(vote.account)]
    // needs conversion to units
    account.activeVoteUnits[vote.group] = (
      account.activeVoteUnits[vote.group] || new BigNumber(0)
    ).plus(vote.value)
  }

  const voteRevoked = await election.getValidatorGroupVoteRevokedEvents(blockNumber)
  for (const vote of voteRevoked) {
    const account = ret[normalizeAddress(vote.account)]
    account.lockedGold = account.lockedGold.plus(vote.value)
  }

  // StableToken.creditTo and StableToken.debitFrom should emit a Transfer event like StableToken._mint
  const stableToken = await kit.contracts.getStableToken()
  const tokenTransfers = await stableToken.getTransferEvents(blockNumber)
  console.info('tokenTransfers')
  console.info(tokenTransfers)

  /*for (const transfer of tokenTransfers) {
    const to = ret[normalizeAddress(transfer.to)]
    // needs event change to distuinguish StableToken instances from only logs
    const name = 'cUSD'
    // needs conversion to units
    to.tokenUnits[name] = (to.tokenUnits[name] || new BigNumber(0)).plus(transfer.value)
  }*/

  // ReleaseGold

  // Epoch rewards

  // Slashing

  return ret
}
