import { ContractKit } from '@celo/contractkit/lib'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { Args, Flags } from '../../utils/command'

const epochIndex: any = {}

async function findIndex(kit: ContractKit, address: string, block: number, epoch: number) {
  if (epochIndex[epoch] !== undefined) return epochIndex[epoch]

  const election = await kit._web3Contracts.getElection()
  const accounts = await kit._web3Contracts.getAccounts()

  // @ts-ignore
  const signers = await election.methods.getCurrentValidatorSigners().call({}, block)

  let acc = 0
  for (const it of signers) {
    const addr = await accounts.methods.signerToAccount(it).call()
    // console.log(it, '->', addr)
    if (addr === address) {
      epochIndex[epoch] = acc
      return acc
    }
    acc++
  }

  return -1
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
    start: flags.integer({ ...Flags.block, required: true }),
    end: flags.integer({ ...Flags.block, required: true }),
  }

  static args = [Args.address('address')]

  static examples = ['analyze 0x5409ed021d9299bf6814279a6a1411a7e866a631 --start 12300 --end 13300']

  async run() {
    const res = this.parse(Analyze)
    const kit = this.kit

    const block = res.flags.start

    const slasher = await kit._web3Contracts.getDowntimeSlasher()
    // const election = await kit._web3Contracts.getElection()

    const endBlock = res.flags.end

    const startEpoch = parseInt(await slasher.methods.getEpochNumberOfBlock(block).call(), 10)
    const endEpoch = parseInt(await slasher.methods.getEpochNumberOfBlock(endBlock).call(), 10)

    console.log(
      `starting at block ${block} (epoch ${startEpoch}), ending at ${endBlock} (epoch ${endEpoch})`
    )

    const address = res.args.address

    const startIndex = await findIndex(kit, address, block, startEpoch)
    const endIndex = await findIndex(kit, address, endBlock, endEpoch)

    console.log('start index', startIndex, 'end index', endIndex)

    let acc1 = 0
    let acc2 = 0

    for (let i = block; i < endBlock; i++) {
      const bitmap = new BigNumber(
        // @ts-ignore
        await slasher.methods.getParentSealBitmap(i + 1).call({}, endBlock + 10)
      )
      const binary = bitmap.toString(2)
      const epoch = parseInt(await slasher.methods.getEpochNumberOfBlock(i).call(), 10)
      const idx = await findIndex(kit, address, i, epoch)
      const down = binary.charAt(binary.length - 1 - idx) === '0'
      acc1 += down ? 0 : 1
      acc2 += down ? 1 : 0
      console.log(epoch, i, printBitmap(binary), idx, down ? 'down' : 'up')
    }
    console.log('up', acc1, 'down', acc2)
  }
}
