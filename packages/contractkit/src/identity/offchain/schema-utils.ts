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
type SchemaResponse<T> = { status: 'ok'; data: T } | { status: 'error'; error: SchemaErrors }
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
): Promise<SchemaResponse<T>> => {
  const resp = await wrapper.readDataFrom(account, dataPath)
  if (resp.status === 'error') {
    return { status: 'error', error: new OffchainError(resp.error) }
  }
  let asJson: any
  try {
    asJson = JSON.parse(resp.data)
  } catch (error) {
    return { status: 'error', error: new InvalidDataError() }
  }
  const parseResult = type.decode(asJson)
  if (isLeft(parseResult)) {
    return { status: 'error', error: new InvalidDataError() }
  }

  return { status: 'ok', data: parseResult.right }
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
