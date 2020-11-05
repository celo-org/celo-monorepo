import { flags } from '@oclif/command'
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
      description: 'Validator (signer or account) address',
      exclusive: ['validators'],
    }),
    validators: Flags.addressArray({
      description: 'Validator (signer or account) address list',
      exclusive: ['validator'],
    }),
    intervals: Flags.intRangeArray({
      description: 'Array of intervals, ordered by min start to max end',
      exclusive: ['beforeBlock'],
    }),
    beforeBlock: flags.integer({
      description: 'Slash for slashable downtime window before provided block',
      exclusive: ['intervals'],
    }),
  }

  static examples = [
    'downtime-slash \
    --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 \
    --validator 0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD \
    --intervals "[100, 149], [150, 199]"',
    'downtime-slash \
    --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 \
    --validator 0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD \
    --slashableDowntimeBeforeBlock 200',
  ]

  async run() {
    const res = this.parse(DowntimeSlashCommand)
    const validatorsToSlash = res.flags.validators ?? [res.flags.validator!]

    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    const intervals = res.flags.beforeBlock
      ? await downtimeSlasher.slashableDowntimeIntervalsBefore(res.flags.beforeBlock)
      : res.flags.intervals!

    const [startBlock, endBlock] = [intervals[0].start, intervals[intervals.length - 1].end]

    await newCheckBuilder(this)
      .addCheck(
        `provided intervals span slashableDowntime blocks `,
        async () => endBlock - startBlock + 1 >= (await downtimeSlasher.slashableDowntime())
      )
      .addCheck(
        `bitmaps are set for intervals`,
        () => downtimeSlasher.isBitmapSetForIntervals(intervals),
        'some bitmaps are not set, please use validator:set-bitmaps'
      )
      .runChecks()

    for (const validator of validatorsToSlash) {
      await newCheckBuilder(this, validator)
        .isSignerOrAccount()
        .canSignValidatorTxs()
        .signerAccountIsValidator()
        .addCheck(
          `validator not already slashed for span`,
          async () => startBlock > (await downtimeSlasher.lastSlashedBlock(validator)),
          `${validator} was already slashed`
        )
        .addCheck(
          'validator was down for intervals',
          () => downtimeSlasher.wasValidatorDownForIntervals(validator, intervals),
          `${validator} was not down`
        )
        .runChecks()

      const tx = await downtimeSlasher.slashValidator(validator, intervals)
      await displaySendTx('slash', tx, undefined, 'DowntimeSlashPerformed')
    }
  }
}
