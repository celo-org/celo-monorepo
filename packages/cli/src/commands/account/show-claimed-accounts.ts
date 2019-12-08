import BigNumber from 'bignumber.js'

import { ContractKit } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { verifyAccountClaim } from '@celo/contractkit/lib/identity/claims/verify'

import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'

async function getMetadata(kit: ContractKit, address: string) {
  const accounts = await kit.contracts.getAccounts()
  const url = await accounts.getMetadataURL(address)
  console.log(address, 'has url', url)
  if (url === '') return IdentityMetadataWrapper.fromEmpty(address)
  else return IdentityMetadataWrapper.fetchFromURL(url)
}

async function getClaims(
  kit: ContractKit,
  address: string,
  data: IdentityMetadataWrapper
): Promise<string[]> {
  if (address.substr(0, 2) === '0x') {
    address = address.substr(2)
  }
  const res = [address]
  const accounts = await kit.contracts.getAccounts()
  for (const claim of data.claims) {
    switch (claim.type) {
      case ClaimTypes.KEYBASE:
        break
      case ClaimTypes.ACCOUNT:
        const status = await verifyAccountClaim(claim, '0x' + address, accounts.getMetadataURL)
        if (status) console.error('Cannot verify claim:', status)
        else {
          console.log('Claim success', address, claim.address)
          res.push(claim.address)
        }
      default:
        break
    }
  }
  return res
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

    const goldToken = await this.kit.contracts.getGoldToken()
    const stableToken = await this.kit.contracts.getStableToken()

    console.log('All balances expressed in units of 10^-18.')
    let sum = new BigNumber(0)
    for (const address of claimedAccounts) {
      console.log('\nShowing balances for', address)
      const totalBalance = await this.kit.getTotalBalance(address)
      const balances = {
        goldBalance: await goldToken.balanceOf(address),
        dollarBalance: await stableToken.balanceOf(address),
        totalBalance,
      }
      sum = sum.plus(totalBalance)
      printValueMap(balances)
    }

    console.log('\nSum of total balances:', sum.toString(10))
  }
}
