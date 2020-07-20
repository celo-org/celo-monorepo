import OffchainDataWrapper, {
  GitStorageUploader,
  LocalStorageWriter,
} from '@celo/contractkit/src/identity/offchain-data-wrapper'
import { flags } from '@oclif/command'
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
    uploader: flags.string({}),
  }

  // @ts-ignore Can't encode that this is happening in init
  offchainDataWrapper: OffchainDataWrapper

  async init() {
    const res = this.parse(OffchainDataCommand)
    this.offchainDataWrapper = new OffchainDataWrapper(res.flags.from, this.kit)
    this.offchainDataWrapper.storageWriter = new LocalStorageWriter(res.flags.directory)
    this.offchainDataWrapper.storageWriter.uploader = new GitStorageUploader(res.flags.directory)
  }
}
