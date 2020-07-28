import OffchainDataWrapper from '@celo/contractkit/src/identity/offchain-data-wrapper'
import {
  GitStorageWriter,
  GoogleStorageWriter,
  LocalStorageWriter,
} from '@celo/contractkit/src/identity/offchain/storage-writers'
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
    provider: flags.string({
      description: `Which provider to use to store the data with`,
    }),
    bucketName: flags.string({
      description: 'Name of the bucket to store data in',
    }),
  }

  // @ts-ignore Can't encode that this is happening in init
  offchainDataWrapper: OffchainDataWrapper

  async init() {
    const res: ParserOutput<any, any> = this.parse()
    this.offchainDataWrapper = new OffchainDataWrapper(res.flags.from, this.kit)

    this.offchainDataWrapper.storageWriter =
      res.flags.provider === 'google' && res.flags.bucketName
        ? new GoogleStorageWriter(res.flags.bucketName, res.flags.directory)
        : res.flags.provider === 'git'
        ? new GitStorageWriter(res.flags.directory)
        : new LocalStorageWriter(res.flags.directory)
  }
}
