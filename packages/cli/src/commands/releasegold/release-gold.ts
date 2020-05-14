import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { ParserOutput } from '@oclif/parser/lib/parse'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'

export abstract class ReleaseGoldCommand extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
  }

  private _contractAddress: string | null = null
  private _releaseGoldWrapper: ReleaseGoldWrapper | null = null

  get contractAddress() {
    if (!this._contractAddress) {
      const res: ParserOutput<any, any> = this.parse()
      this._contractAddress = String(res.flags.contract)
    }
    return this._contractAddress
  }

  get releaseGoldWrapper() {
    if (!this._releaseGoldWrapper) {
      this.error('Error in initilizing release gold wrapper')
    }
    return this._releaseGoldWrapper
  }

  async init() {
    await super.init()
    if (!this._releaseGoldWrapper) {
      this._releaseGoldWrapper = new ReleaseGoldWrapper(
        this.kit,
        newReleaseGold(this.kit.web3, this.contractAddress as string)
      )
      // Call arbitrary release gold fn to verify `contractAddress` is a releasegold contract.
      try {
        await this._releaseGoldWrapper.getBeneficiary()
      } catch (err) {
        this.error(`Does the provided address point to release gold contract? ${err}`)
      }
    }
  }
}
