import { Result } from '@celo/base'
import { SchemaErrors } from './errors'

export interface PublicAccessor<DataType> {
  write: (data: DataType) => Promise<SchemaErrors | void>
  read: (from: string) => Promise<DataType>
  readAsResult: (from: string) => Promise<Result<DataType, SchemaErrors>>
}

export interface PrivateAccessor<DataType> {
  write: (data: DataType, to: string[], symmetricKey?: Buffer) => Promise<SchemaErrors | void>
  read: (from: string) => Promise<DataType>
  readAsResult: (from: string) => Promise<Result<DataType, SchemaErrors>>
}
