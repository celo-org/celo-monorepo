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

export async function getCredits(
  kit: ContractKit,
  blockNumber: number
): Promise<Record<Address, AccountAssets>> {
  const ret: Record<Address, AccountAssets> = {}

  const goldTransfers = await traceBlock(
    kit.web3.currentProvider,
    blockNumber,
    'cgld_transfer_tracer'
  )
  for (const transfer of goldTransfers.values) {
    const account = ret[normalizeAddress(transfer.to)]
    account.gold = account.gold.plus(transfer.value)
  }

  const lockedGold = await kit.contracts.getLockedGold()
  const goldLocked = await lockedGold.getGoldLockedEvents(blockNumber)
  for (const locked of goldLocked) {
    const account = ret[normalizeAddress(locked.account)]
    // needs event change to distuinguish LockedGold lock() from relock() fromm only logs
    account.lockedGold = account.lockedGold.plus(locked.value)
  }

  const stableToken = await kit.contracts.getStableToken()
  const tokenTransfers = await stableToken.getTransferEvents(blockNumber)
  for (const transfer of tokenTransfers) {
    const to = ret[normalizeAddress(transfer.to)]
    // needs event change to distuinguish StableToken instances from only logs
    const name = 'cUSD'
    // needs conversion to units
    to.tokenUnits[name] = (to.tokenUnits[name] || new BigNumber(0)).plus(transfer.value)
  }

  return ret
}
