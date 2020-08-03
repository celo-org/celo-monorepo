import { chain, Either, parseJSON } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import { Address } from '../../base'
import OffchainDataWrapper, { OffchainErrors } from '../offchain-data-wrapper'

class InvalidDataError extends Error {}
class OffchainError extends Error {
  constructor(readonly error: OffchainErrors) {
    super()
  }
}
type SchemaErrors = OffchainError | InvalidDataError

export class SingleSchema<T> {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly type: t.Type<T>,
    readonly dataPath: string
  ) {}

  async read(account: string) {
    return readWithSchema(this.wrapper, this.type, account, this.dataPath)
  }

  async write(data: T) {
    return writeWithSchema(this.wrapper, this.type, this.dataPath, data)
  }
}

export const readWithSchema = async <T>(
  wrapper: OffchainDataWrapper,
  type: t.Type<T>,
  account: Address,
  dataPath: string
): Promise<Either<t.Errors, T>> => {
  return pipe(
    await wrapper.readDataFrom(account, dataPath),
    chain((data: string) => parseJSON(data, () => new InvalidDataError())),
    type.decode
  )
}

export const writeWithSchema = async <T>(
  wrapper: OffchainDataWrapper,
  type: t.Type<T>,
  dataPath: string,
  data: T
) => {
  if (!type.is(data)) {
    return
  }
  const serializedData = JSON.stringify(data)
  await wrapper.writeDataTo(serializedData, dataPath)
  return
}
