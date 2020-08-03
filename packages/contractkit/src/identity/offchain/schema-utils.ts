import { isRight } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { Address } from '../../base'
import OffchainDataWrapper, { OffchainErrors } from '../offchain-data-wrapper'

class InvalidDataError extends Error {}
class OffchainError extends Error {
  constructor(readonly error: OffchainErrors) {
    super()
  }
}
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
): Promise<T> => {
  let resp

  try {
    resp = await wrapper.readDataFrom(account, dataPath)
  } catch (error) {
    throw new OffchainError(error)
  }

  try {
    const asJson = JSON.parse(resp)
    const parseResult = type.decode(asJson)
    if (isRight(parseResult)) {
      return parseResult.right
    }
    throw new InvalidDataError()
  } catch (error) {
    throw new InvalidDataError()
  }
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
