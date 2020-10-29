import { zip } from '@celo/utils/lib/collections'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class DowntimeSlashCommand extends BaseCommand {
  static description = 'Downtime slash a validator'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'From address to perform the slash (reward recipient)',
    }),
    validator: Flags.address({
      required: true,
      description: 'Validator (signer or account) address',
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
    'downtime-slash \
    --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 \
    --validator 0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD \
    --startBlocks "[100, 150]" --endBlocks "[149, 199]"',
  ]

  async run() {
    const res = this.parse(DowntimeSlashCommand)
    const validator = res.flags.validator
    const startBlocks = res.flags.startBlocks
    const endBlocks = res.flags.endBlocks
    const intervals = zip((start, end) => ({ start, end }), startBlocks, endBlocks)

    const checkBuilder = newCheckBuilder(this, validator)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidator()

    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    const slashableDowntime = await downtimeSlasher.slashableDowntime()

    checkBuilder
      .addCheck(
        `validator not already slashed for span`,
        async () =>
          intervals[0].start > (await downtimeSlasher.lastSlashedBlock(res.flags.validator))
      )
      .addCheck(
        `provided intervals span slashableDowntime blocks (${slashableDowntime})`,
        () => slashableDowntime < intervals[intervals.length - 1].end - intervals[0].start + 1
      )
      .addCheck(`bitmaps are set for intervals (${intervals})`, async () => {
        for (const interval of intervals) {
          const set = await downtimeSlasher.isBitmapSetForInterval(interval.start, interval.end)
          if (!set) {
            return false
          }
        }
        return true
      })
      .addCheck(`validator was down for intervals`, () =>
        downtimeSlasher.wasValidatorDown(validator, startBlocks, endBlocks)
      )

    await checkBuilder.runChecks()

    const tx = await downtimeSlasher.slashValidator(validator, startBlocks, endBlocks)
    await displaySendTx('slash', tx, undefined, 'DowntimeSlashPerformed')
  }
}
