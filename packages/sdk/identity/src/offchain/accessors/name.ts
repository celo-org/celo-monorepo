import * as t from 'io-ts'
import { OffchainDataWrapper } from '../../offchain-data-wrapper'
import { PrivateSimpleAccessor, PublicSimpleAccessor } from './simple'

const NameSchema = t.type({
  name: t.string,
})

export type NameType = t.TypeOf<typeof NameSchema>

export class PublicNameAccessor extends PublicSimpleAccessor<NameType> {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, NameSchema, '/account/name')
  }
}

export class PrivateNameAccessor extends PrivateSimpleAccessor<NameType> {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, NameSchema, '/account/name')
  }
}
