import BigNumber from 'bignumber.js'

import { ContractKit } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { AccountClaim } from '@celo/contractkit/lib/identity/claims/account'
import { verifyAccountClaim } from '@celo/contractkit/lib/identity/claims/verify'
import { ensureLeading0x } from '@celo/utils/lib/address'
import { notEmpty } from '@celo/utils/lib/collections'

import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'

async function getMetadata(kit: ContractKit, address: string) {
  const accounts = await kit.contracts.getAccounts()
  const url = await accounts.getMetadataURL(address)
  console.log(address, 'has url', url)
  if (url === '') return IdentityMetadataWrapper.fromEmpty(address)
  else return IdentityMetadataWrapper.fetchFromURL(url)
}

function dedup(lst: string[]): string[] {
  return [...new Set(lst)]
}

async function getClaims(
  kit: ContractKit,
  address: string,
  data: IdentityMetadataWrapper
): Promise<string[]> {
  const accounts = await kit.contracts.getAccounts()
  const getClaim = async (claim: AccountClaim) => {
    const error = await verifyAccountClaim(claim, ensureLeading0x(address), accounts.getMetadataURL)
    return error ? null : claim.address.toLowerCase()
  }
  const res = (await Promise.all(data.filterClaims(ClaimTypes.ACCOUNT).map(getClaim))).filter(
    notEmpty
  )
  res.push(address)
  return dedup(res)
}

async function getPendingWithdrawalsTotalValue(kit: ContractKit, account: string, bn: number) {
  try {
    const lockedGold = await kit._web3Contracts.getLockedGold()
    // @ts-ignore
    const pendingWithdrawals = await lockedGold.methods.getPendingWithdrawals(account).call({}, bn)
    const values = pendingWithdrawals[1].map((a: any) => new BigNumber(a))
    const reducer = (total: BigNumber, pw: BigNumber) => pw.plus(total)
    return values.reduce(reducer, new BigNumber(0))
  } catch (err) {
    return new BigNumber(0)
  }
}

async function getTotalBalance(kit: ContractKit, address: string, bn: number): Promise<BigNumber> {
  const goldToken = await kit._web3Contracts.getGoldToken()
  const stableToken = await kit._web3Contracts.getStableToken()
  const lockedGold = await kit._web3Contracts.getLockedGold()
  const exchange = await kit._web3Contracts.getExchange()
  // @ts-ignore
  const goldBalance = new BigNumber(await goldToken.methods.balanceOf(address).call({}, bn))
  // @ts-ignore
  const lockedBalance = new BigNumber(
    await lockedGold.methods.getAccountTotalLockedGold(address).call({}, bn)
  )
  // @ts-ignore
  const dollarBalance = await stableToken.methods.balanceOf(address).call({}, bn)
  // @ts-ignore
  const pending = await getPendingWithdrawalsTotalValue(kit, address, bn)
  // @ts-ignore
  const dollarAsGold = new BigNumber(
    await exchange.methods.getBuyTokenAmount(dollarBalance, false).call({}, bn)
  )
  return goldBalance
    .plus(lockedBalance)
    .plus(dollarAsGold)
    .plus(pending)
}

export default class ShowClaimedAccounts extends BaseCommand {
  static description = 'Show information about claimed accounts'

  static flags = {
    ...BaseCommand.flags,
    'at-block': flags.integer({
      description: 'block for which to show total balance',
    }),
  }

  static args = [Args.address('address')]

  static examples = ['show-claimed-accounts 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(ShowClaimedAccounts)

    const metadata = await getMetadata(this.kit, res.args.address)

    const claimedAccounts = await getClaims(this.kit, res.args.address, metadata)

    const bn = res.flags['at-block'] ?? (await this.web3.eth.getBlockNumber())

    console.log('All balances expressed in units of 10^-18.')
    let sum = new BigNumber(0)
    for (const address of claimedAccounts) {
      console.log('\nShowing balances for', address)
      const balance = await getTotalBalance(this.kit, address, bn)
      sum = sum.plus(balance)
    }

    console.log('\nSum of total balances:', sum.toString(10))
  }
}
