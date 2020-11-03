import { zip } from '@celo/utils/lib/collections'
import { flags } from '@oclif/command'
import { readFileSync } from 'fs'
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
      exclusive: ['validatorsJson'],
    }),
    signersJson: flags.string({
      description: 'path to json file with list of validators to slash',
      exclusive: ['validator'],
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
    const startBlocks = res.flags.startBlocks
    const endBlocks = res.flags.endBlocks
    const intervals = zip((start, end) => ({ start, end }), startBlocks, endBlocks)

    const downtimeSlasher = await this.kit.contracts.getDowntimeSlasher()
    const slashableDowntime = await downtimeSlasher.slashableDowntime()

    const validators = await this.kit.contracts.getValidators()

    let validatorsToSlash: string[]
    if (res.flags.signersJson) {
      const validatorObjectArray: any[] = JSON.parse(readFileSync(res.flags.signersJson).toString())
      validatorsToSlash = validatorObjectArray.map((o) => o.signer)
    } else {
      validatorsToSlash = [res.flags.validator!]
    }

    for (const validatorOrSigner of validatorsToSlash) {
      const validator = await validators.signerToAccount(validatorOrSigner)

      const checkBuilder = newCheckBuilder(this, validator)
        .isSignerOrAccount()
        .canSignValidatorTxs()
        .signerAccountIsValidator()
        .addCheck(
          `validator not already slashed for span`,
          async () => intervals[0].start > (await downtimeSlasher.lastSlashedBlock(validator))
        )
        .addCheck(
          `provided intervals span slashableDowntime blocks (${slashableDowntime})`,
          () => slashableDowntime <= Math.max(...endBlocks) - Math.min(...startBlocks) + 1
        )
        .addCheck(
          `bitmaps are set for intervals`,
          async () => {
            for (const interval of intervals) {
              const set = await downtimeSlasher.isBitmapSetForInterval(interval.start, interval.end)
              if (!set) {
                return false
              }
            }
            return true
          },
          'some bitmaps are not set, please use validator:set-bitmaps'
        )
        .addCheck(`validator was down for intervals`, () =>
          downtimeSlasher.wasValidatorDown(validator, startBlocks, endBlocks)
        )

      await checkBuilder.runChecks()

      const tx = await downtimeSlasher.slashValidator(validator, startBlocks, endBlocks)
      await displaySendTx('slash', tx, undefined, 'DowntimeSlashPerformed')
    }
  }
}
