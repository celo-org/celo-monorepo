import { zip } from '@celo/utils/lib/collections'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetBitmapsCommand extends BaseCommand {
  static description = 'Set validator signature bitmaps for provided intervals'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'From address to sign set bitmap transactions',
    }),
    startBlocks: Flags.intArray({
      required: true,
      description: 'Array of start blocks for intervals',
      dependsOn: ['endBlocks'],
    }),
    endBlocks: Flags.intArray({
      required: true,
      description: 'Array of end blocks for intervals',
      dependsOn: ['startBlocks'],
    }),
  }

  static examples = [
    'set-bitmaps \
    --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 \
    --startBlocks "[100, 150]" --endBlocks "[149, 199]"',
  ]

  async run() {
    const res = this.parse(SetBitmapsCommand)

    const startBlocks = res.flags.startBlocks
    const endBlocks = res.flags.endBlocks
    const intervals = zip((start, end) => ({ start, end }), startBlocks, endBlocks)

    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()

    let someSet = false
    let setInterval = {}
    for (const interval of intervals) {
      someSet = await downtimeSlasher.isBitmapSetForInterval(interval.start, interval.end)
      if (someSet) {
        setInterval = interval
        break
      }
    }

    await newCheckBuilder(this)
      .addCheck(
        `bitmaps are not already set for intervals`,
        () => someSet,
        `interval ${setInterval} already set`
      )
      .runChecks()

    for (const interval of intervals) {
      const tx = downtimeSlasher.setBitmapForInterval(interval.start, interval.end)
      await displaySendTx('setBitmap', tx, undefined, 'BitmapSetForInterval')
    }
  }
}
