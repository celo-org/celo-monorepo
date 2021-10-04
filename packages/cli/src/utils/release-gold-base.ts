import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import ReleaseGoldArtifact from '@celo/protocol/build/core-contracts.v5/contracts/ReleaseGold.json'
import { ParserOutput } from '@oclif/parser/lib/parse'
import { BaseCommand } from '../base'
import { Flags } from './command'

export abstract class ReleaseGoldBaseCommand extends BaseCommand {
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
      const runtimeBytecode = await this.web3.eth.getCode(this.contractAddress)
      if (runtimeBytecode !== ReleaseGoldArtifact.deployedBytecode) {
        throw new Error(
          `Contract at ${this.contractAddress} does not match expected ReleaseGold bytecode`
        )
      }
      this._releaseGoldWrapper = new ReleaseGoldWrapper(
        this.kit,
        newReleaseGold(this.kit.connection.web3, this.contractAddress)
      )
    }
  }
}
