import { zip } from '@celo/utils/lib/collections'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
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
    slashableDowntimeBeforeBlock: flags.integer({
      description: 'Set all bitmaps for slashable downtime window before provided block',
      exclusive: ['startBlocks', 'endBlocks', 'slashableDowntimeBeforeLatest'],
    }),
    slashableDowntimeBeforeLatest: flags.boolean({
      description: 'Set all bitmaps for slashable downtime window before latest block',
      exclusive: ['startBlocks', 'endBlocks', 'slashableDowntimeBeforeBlock'],
    }),
    startBlocks: Flags.intArray({
      description: 'Array of start blocks for intervals',
      dependsOn: ['endBlocks'],
    }),
    endBlocks: Flags.intArray({
      description: 'Array of end blocks for intervals',
      dependsOn: ['startBlocks'],
    }),
  }

  static examples = [
    'set-bitmaps --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --slashableDowntimeBeforeBlock 10000',
    'set-bitmaps --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --startBlocks "[100, 150]" --endBlocks "[149, 199]"',
  ]

  async run() {
    const res = this.parse(SetBitmapsCommand)

    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()

    const intervals =
      res.flags.slashableDowntimeBeforeLatest || res.flags.slashableDowntimeBeforeBlock
        ? await downtimeSlasher.intervalsForSlashableDowntimeWindowBeforeBlock(
            res.flags.slashableDowntimeBeforeBlock
          )
        : zip((start, end) => ({ start, end }), res.flags.startBlocks!, res.flags.endBlocks!)

    const bitmapsSet = await Promise.all(
      intervals.map((interval) =>
        downtimeSlasher.isBitmapSetForInterval(interval.start, interval.end)
      )
    )

    const unsetIntervals = intervals.filter((_, idx) => !bitmapsSet[idx])
    console.log(unsetIntervals)

    for (const interval of unsetIntervals.reverse()) {
      const tx = downtimeSlasher.setBitmapForInterval(interval.start, interval.end)
      await displaySendTx('setBitmap', tx, undefined, 'BitmapSetForInterval')
    }
  }
}
