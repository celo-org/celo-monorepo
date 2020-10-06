import { newBlockExplorer } from '@celo/contractkit/lib/explorer/block-explorer'
import { TransactionData } from '@celo/contractkit/lib/wrappers/MultiSig'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class ShowMultiSig extends BaseCommand {
  static description = 'Shows information about multi-sig contract'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    tx: flags.integer({
      default: undefined,
      description: 'Show info for a transaction',
    }),
    all: flags.boolean({ default: false, description: 'Show info about all transactions' }),
    raw: flags.boolean({ default: false, description: 'Do not attempt to parse transactions' }),
  }

  static args = [Args.address('address')]

  static examples = [
    'show 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --tx 3',
    'show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --all --raw',
  ]

  async run() {
    const {
      args,
      flags: { tx, all, raw },
    } = this.parse(ShowMultiSig)
    const multisig = await this.kit.contracts.getMultiSig(args.address)
    const txs = await multisig.getTransactionCount()
    const explorer = await newBlockExplorer(this.kit)
    const process = async (txdata: TransactionData) => {
      if (raw) return txdata
      return { ...txdata, data: explorer.tryParseTxInput(txdata.destination, txdata.data) }
    }
    const txinfo =
      tx !== undefined
        ? await process(await multisig.getTransaction(tx))
        : all
        ? await Promise.all((await multisig.getTransactions()).map(process))
        : txs
    const info = {
      Owners: await multisig.getOwners(),
      'Required confirmations': await multisig.getRequired(),
      'Required confirmations (internal)': await multisig.getInternalRequired(),
      Transactions: txinfo,
    }
    printValueMapRecursive(info)
  }
}
