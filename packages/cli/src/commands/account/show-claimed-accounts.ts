import { ContractKit } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { AccountClaim } from '@celo/contractkit/lib/identity/claims/account'
import { verifyAccountClaim } from '@celo/contractkit/lib/identity/claims/verify'
import { ensureLeading0x } from '@celo/utils/lib/address'
import { notEmpty } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'

async function getMetadata(kit: ContractKit, address: string) {
  const accounts = await kit.contracts.getAccounts()
  const url = await accounts.getMetadataURL(address)
  console.log(address, 'has url', url)
  if (url === '') return IdentityMetadataWrapper.fromEmpty(address)
  else return IdentityMetadataWrapper.fetchFromURL(kit, url)
}

function dedup(lst: string[]): string[] {
  return [...new Set(lst)]
}

async function getClaims(
  kit: ContractKit,
  address: string,
  data: IdentityMetadataWrapper
): Promise<string[]> {
  const getClaim = async (claim: AccountClaim) => {
    const error = await verifyAccountClaim(kit, claim, ensureLeading0x(address))
    return error ? null : claim.address.toLowerCase()
  }
  const res = (await Promise.all(data.filterClaims(ClaimTypes.ACCOUNT).map(getClaim))).filter(
    notEmpty
  )
  res.push(address)
  return dedup(res)
}

export default class ShowClaimedAccounts extends BaseCommand {
  static description = 'Show information about claimed accounts'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('address')]

  static examples = ['show-claimed-accounts 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const { args } = this.parse(ShowClaimedAccounts)

    const metadata = await getMetadata(this.kit, args.address)

    const claimedAccounts = await getClaims(this.kit, args.address, metadata)

    console.log('All balances expressed in units of 10^-18.')
    let sum = new BigNumber(0)
    for (const address of claimedAccounts) {
      console.log('\nShowing balances for', address)
      const balance = await this.kit.getTotalBalance(address)
      sum = sum.plus(balance.total)
      printValueMap(balance)
    }

    console.log('\nSum of total balances:', sum.toString(10))
  }
}
