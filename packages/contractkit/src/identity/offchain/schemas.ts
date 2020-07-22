import * as t from 'io-ts'
import OffchainDataWrapper from '../offchain-data-wrapper'
import { SingleSchema } from './schema-utils'

const NameSchema = t.type({
  name: t.string,
})
type NameType = t.TypeOf<typeof NameSchema>

export class NameAccessor extends SingleSchema<NameType> {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, NameSchema, '/account/name')
  }
}
