import { Err, makeAsyncThrowable, Ok, Result, RootError } from '@celo/base/lib/result'
import { isRight } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { Address } from '../../base'
import OffchainDataWrapper, { OffchainErrors } from '../offchain-data-wrapper'

export enum SchemaErrorTypes {
  InvalidDataError = 'InvalidDataError',
  OffchainError = 'OffchainError',
}

export class InvalidDataError extends RootError<SchemaErrorTypes.InvalidDataError> {
  constructor() {
    super(SchemaErrorTypes.InvalidDataError)
  }
}

export class OffchainError extends RootError<SchemaErrorTypes.OffchainError> {
  constructor(readonly error: OffchainErrors) {
    super(SchemaErrorTypes.OffchainError)
  }
}

type SchemaErrors = InvalidDataError | OffchainError

export class SingleSchema<T> {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly type: t.Type<T>,
    readonly dataPath: string
  ) {}

  async readAsResult(account: string) {
    return readWithSchemaAsResult(this.wrapper, this.type, account, this.dataPath)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))

  async write(data: T) {
    return writeWithSchema(this.wrapper, this.type, this.dataPath, data)
  }
}

export const readWithSchemaAsResult = async <T>(
  wrapper: OffchainDataWrapper,
  type: t.Type<T>,
  account: Address,
  dataPath: string
): Promise<Result<T, SchemaErrors>> => {
  const resp = await wrapper.readDataFromAsResult(account, dataPath)

  if (!resp.ok) {
    return Err(new OffchainError(resp.error))
  }

  try {
    const asJson = JSON.parse(resp.result)
    const parseResult = type.decode(asJson)
    if (isRight(parseResult)) {
      return Ok(parseResult.right)
    }
    return Err(new RootError(SchemaErrorTypes.InvalidDataError))
  } catch (error) {
    return Err(new RootError(SchemaErrorTypes.InvalidDataError))
  }
}

export const readWithSchema = makeAsyncThrowable(readWithSchemaAsResult)

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
