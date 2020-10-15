import * as t from 'io-ts'
import OffchainDataWrapper from '../../offchain-data-wrapper'
import { EncryptedSimpleSchema, SimpleSchema } from '../schemas'

const NameSchema = t.type({
  name: t.string,
})

export type NameType = t.TypeOf<typeof NameSchema>

export class NameAccessor extends SimpleSchema<NameType> {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, NameSchema, '/account/name')
  }
}

export class EncryptedNameAccessor extends EncryptedSimpleSchema<NameType> {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, NameSchema, '/account/name')
  }
}
