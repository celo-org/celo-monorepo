import { ContractKit } from '@celo/contractkit/lib'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
// import { Args, Flags } from '../../utils/command'

export const table = {
  down: {},
  total: {},
  percent: {},
  name: {},
  address: {},
}
const epochValidators: any = {}

async function getEpochValidators(kit: ContractKit, block: number, epoch: number) {
  if (epochValidators[epoch] !== undefined) return epochValidators[epoch]

  const election = await kit._web3Contracts.getElection()
  const accounts = await kit._web3Contracts.getAccounts()

  // @ts-ignore
  const signers = await election.methods.getCurrentValidatorSigners().call({}, block)

  const acc = []
  for (const it of signers) {
    const addr = await accounts.methods.signerToAccount(it).call()
    acc.push(addr)
  }

  epochValidators[epoch] = acc

  return acc
}

function printBitmap(str: string) {
  while (str.length < 100) str = '0' + str
  let res = ''
  for (let i = 0; i < 100; i++) {
    res += str.charAt(i) === '1' ? '.' : 'X'
  }
  return res
}

export default class Analyze extends BaseCommand {
  static description = 'Analyze downtime'

  static flags = {
    ...BaseCommand.flags,
    start: flags.integer({ description: 'First block', required: true }),
    end: flags.integer({ description: 'Last block', required: true }),
  }

  static args = []

  static examples = ['downtime --start 12300 --end 13300']

  async run() {
    const res = this.parse(Analyze)
    const kit = this.kit

    const block = res.flags.start

    const slasher = await kit._web3Contracts.getDowntimeSlasher()
    // const election = await kit._web3Contracts.getElection()

    const endBlock = res.flags.end
    const accounts = await kit.contracts.getAccounts()

    const startEpoch = parseInt(await slasher.methods.getEpochNumberOfBlock(block).call(), 10)
    const endEpoch = parseInt(await slasher.methods.getEpochNumberOfBlock(endBlock).call(), 10)

    console.log(
      `Starting at block ${block} (epoch ${startEpoch}), ending at ${endBlock} (epoch ${endEpoch})`
    )

    const stats: any = {}

    for (let i = block; i <= endBlock; i++) {
      const bitmap = new BigNumber(
        // @ts-ignore
        await slasher.methods.getParentSealBitmap(i + 1).call({}, endBlock + 2)
      )
      const binary = bitmap.toString(2)
      const epoch = parseInt(await slasher.methods.getEpochNumberOfBlock(i).call(), 10)
      const prevEpoch = parseInt(await slasher.methods.getEpochNumberOfBlock(i - 1).call(), 10)
      const validators: string[] = await getEpochValidators(kit, i, epoch)
      let downValidators = 0
      validators.map((v, idx) => {
        const down = binary.charAt(binary.length - 1 - idx) === '0'
        stats[v] = stats[v] || { down: 0, total: 0, address: v }
        stats[v].down += down ? 1 : 0
        stats[v].total++
        downValidators += down ? 1 : 0
      })
      console.log(
        epoch,
        i,
        printBitmap(binary),
        downValidators,
        epoch !== prevEpoch ? 'EPOCH CHANGE' : ''
      )
    }
    const lst: any[] = await Promise.all(
      Object.values(stats).map(async (a: any) => ({
        ...a,
        percent: a.down / a.total,
        name: await accounts.getName(a.address),
      }))
    )
    const sorted = lst.sort((a, b) => a.percent - b.percent)
    const percentString = (a: number) => Math.round(a * 100) + '%'
    cli.table(
      sorted.map((a) => ({ ...a, percent: percentString(a.percent) })),
      table
    )
  }
}
