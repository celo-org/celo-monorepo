import { isLeft } from 'fp-ts/lib/Either'
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
): Promise<[T | null, SchemaErrors | null]> => {
  const [data, err] = await wrapper.readDataFrom(account, dataPath)
  if (err) {
    return [null, new OffchainError(err)]
  }
  let asJson: any
  try {
    asJson = JSON.parse(data)
  } catch (error) {
    return [null, new InvalidDataError()]
  }
  const parseResult = type.decode(asJson)
  if (isLeft(parseResult)) {
    return [null, new InvalidDataError()]
  }

  return [parseResult.right, null]
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
