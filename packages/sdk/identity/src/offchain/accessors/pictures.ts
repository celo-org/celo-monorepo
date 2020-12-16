import { OffchainDataWrapper } from '../../offchain-data-wrapper'
import { PrivateBinaryAccessor, PublicBinaryAccessor } from './binary'

export class PublicPictureAccessor extends PublicBinaryAccessor {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, '/account/picture')
  }
}

export class PrivatePictureAccessor extends PrivateBinaryAccessor {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, '/account/picture')
  }
}
