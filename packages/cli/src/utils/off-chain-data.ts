import OffchainDataWrapper from '@celo/contractkit/lib/identity/offchain-data-wrapper'
import {
  GitStorageWriter,
  LocalStorageWriter,
} from '@celo/contractkit/lib/identity/offchain/storage-writers'
import { flags } from '@oclif/command'
import { ParserOutput } from '@oclif/parser/lib/parse'
import { BaseCommand } from '../base'
import { Flags, parsePath } from './command'

export abstract class OffchainDataCommand extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'Address with which to sign',
    }),
    directory: flags.string({
      parse: parsePath,
      required: true,
      description: 'To which directory data should be written',
    }),
    uploadWithGit: flags.boolean({
      default: false,
      description: 'If the CLI should attempt to push changes to the origin via git',
    }),
  }

  // @ts-ignore Can't encode that this is happening in init
  offchainDataWrapper: OffchainDataWrapper

  async init() {
    const res: ParserOutput<any, any> = this.parse()
    this.offchainDataWrapper = new OffchainDataWrapper(res.flags.from, this.kit)

    this.offchainDataWrapper.storageWriter = res.flags.uploadWithGit
      ? new GitStorageWriter(res.flags.directory)
      : new LocalStorageWriter(res.flags.directory)
  }
}
