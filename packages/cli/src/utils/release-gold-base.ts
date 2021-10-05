import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { ParserOutput } from '@oclif/parser/lib/parse'
// import { flags } from '@oclif/command'
// import { readJsonSync } from 'fs-extra'
// import ReleaseGoldArtifactfrom '../../ReleaseGold.json'
import { BaseCommand } from '../base'
import { Flags } from './command'

export abstract class ReleaseGoldBaseCommand extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
    // verifyBytecode: flags.boolean({ required: false, default: false, description: 'Verify bytecode of contract'}),
    // verifyStorage: flags.string({ required: false, description: 'Path to json where grant is specified'}),
  }

  private _contractAddress: string | null = null
  private _releaseGoldWrapper: ReleaseGoldWrapper | null = null

  get contractAddress() {
    if (!this._contractAddress) {
      const res: ParserOutput<any, any> = this.parse()
      this._contractAddress = res.flags.contract as string
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
      // const res: ParserOutput<any, any> = this.parse()
      // if (res.flags.verifyBytecode as boolean) {
      //   const runtimeBytecode = await this.web3.eth.getCode(this.contractAddress)
      //   if (runtimeBytecode !== ReleaseGoldArtifact.deployedBytecode) {
      //     throw new Error(
      //       `Contract at ${this.contractAddress} does not match expected ReleaseGold bytecode`
      //     )
      //   }
      // }
      this._releaseGoldWrapper = new ReleaseGoldWrapper(
        this.kit,
        newReleaseGold(this.kit.connection.web3, this.contractAddress)
      )
      // if (res.flags.verifyStorage) {
      //   const grant = readJsonSync(res.flags.verifyStorage, {})
      // }
    }
  }
}
