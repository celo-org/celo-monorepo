import { findAddressIndex } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { Args, Flags } from '../../utils/command'

export default class Downtime extends BaseCommand {
  static description = 'Slash for downtime'

  static flags = {
    ...BaseCommand.flags,
    block: flags.integer({ ...Flags.block, required: true }),
  }

  static args = [Args.address('address')]

  static examples = ['downtime 0x5409ed021d9299bf6814279a6a1411a7e866a631 --block 12300']

  async run() {
    const res = this.parse(Downtime)
    const kit = this.kit

    const block = res.flags.block

    const slasher = await kit.contracts.getDowntimeSlasher()

    const election = await kit.contracts.getElection()
    // const lst = await election.getEligibleValidatorGroupsVotes()
    // lst.forEach((a) => console.log(a))

    const period = await slasher.slashableDowntime()

    const endBlock = block + period

    console.log('Slashable downtime', period)

    const startEpoch = await kit.getEpochNumberOfBlock(block)
    const endEpoch = await kit.getEpochNumberOfBlock(block)

    console.log(
      `starting at block ${block} (epoch ${startEpoch}), ending at ${endBlock} (epoch ${endEpoch})`
    )

    const address = res.args.address

    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(address)
    const startIndex = findAddressIndex(
      validator.signer,
      await validators.getValidatorSignerAddressSet(block)
    )
    const endIndex = findAddressIndex(
      validator.signer,
      await validators.getValidatorSignerAddressSet(endBlock)
    )

    console.log('start index', startIndex, 'end index', endIndex)

    const votedGroups = await election.getGroupsVotedForByAccount(address)

    console.log(votedGroups)

    const incentives = await slasher.slashingIncentives()
    const membership = await validators.getValidatorMembershipHistoryIndex(address, block)
    const lockedGold = await this.kit.contracts.getLockedGold()
    const slashValidator = await lockedGold.computeInitialParametersForSlashing(
      address,
      incentives.penalty
    )
    const slashGroup = await lockedGold.computeParametersForSlashing(
      membership.group,
      incentives.penalty,
      slashValidator.list
    )

    console.info(
      'validator',
      slashValidator.lessers,
      slashValidator.greaters,
      slashValidator.indices
    )

    console.info('group', slashGroup.lessers, slashGroup.greaters, slashGroup.indices)

    await slasher.slashValidator(address, block)

    const test = await slasher.isDown(block, startIndex, endIndex)
    console.log('is down: ', test)
    /*
    const test = await slasher.methods
      .isDown(block, startIndex, endIndex)
      // @ts-ignore
      .call({ gas: 10000000 }, endBlock + 100)
    console.log('is down: ', test)

    console.log('got', dry)
    */
  }
}
