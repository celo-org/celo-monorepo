import OffchainDataWrapper from '../../offchain-data-wrapper'
import { BinarySchema, EncryptedBinarySchema } from '../schemas'

export class ProfilePicture extends BinarySchema {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, '/account/picture')
  }
}

export class EncryptedProfilePicture extends EncryptedBinarySchema {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, '/account/picture')
  }
}
