import { getStableTokenContract, makeReportTx } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BigNumber } from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class OracleReport extends BaseCommand {
  static description = 'Make stabletoken/celo gold exchange rate report'

  static flags = {
    ...BaseCommand.flags,
    tokenAddress: Flags.address({
      required: false,
      description: 'Adress of stabletoken. Defaults to cUSD if not present',
    }),
    numerator: flags.string({
      required: true,
      description: 'Stabletoken component of exchange rate',
    }),
    denominator: flags.string({
      required: true,
      description: 'Gold component of exchange rate',
    }),
  }

  async run() {
    const res = this.parse(OracleReport)
    const stableTokenContract = await getStableTokenContract(this.web3)

    const tokenAddress: string = res.flags.tokenAddress
      ? res.flags.tokenAddress
      : stableTokenContract._address
    const num = new BigNumber(res.flags.numerator)
    const denom = new BigNumber(res.flags.denominator)

    await displaySendTx('oracle.Report', await makeReportTx(this.web3, tokenAddress, num, denom))
  }
}
