import { Err, Ok, parseJsonAsResult, Result } from '@celo/base/lib/result'
import { SequentialDelayDomainSchema } from '@celo/phone-number-privacy-common/lib/domains'
import { pipe } from 'fp-ts/lib/pipeable'
import { chain, isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { Backup } from './backup'
import { DecodeError } from './errors'

const BASE64_REGEXP = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/

/** Utility type to leverage io-ts for encoding and decoding of buffers from base64 strings. */
export const BufferFromBase64 = new t.Type<Buffer, string, unknown>(
  'BufferFromBase64',
  Buffer.isBuffer,
  (unk: unknown, context: t.Context) =>
    pipe(
      t.string.validate(unk, context),
      chain((str: string) => {
        // Check that the string is base64 data and return the decoding if it is.
        if (!BASE64_REGEXP.test(str)) {
          return t.failure(unk, context)
        }
        return t.success(Buffer.from(str, 'base64'))
      })
    ),
  (buffer: Buffer) => buffer.toString('base64')
)

/** io-ts codec used to encode and decode backups from JSON objects */
export const BackupSchema: t.Type<Backup, object> = t.intersection([
  // Required fields
  t.type({
    encryptedData: BufferFromBase64,
    nonce: BufferFromBase64,
    version: t.string,
    metadata: t.type({}),
    environment: t.type({}),
  }),
  // Optional fields
  // https://github.com/gcanti/io-ts/blob/master/index.md#mixing-required-and-optional-props
  t.partial({
    odisDomain: SequentialDelayDomainSchema,
    encryptedFuseKey: BufferFromBase64,
  }),
])

export function serializeBackup(backup: Backup): string {
  return JSON.stringify(BackupSchema.encode(backup))
}

export function deserializeBackup(data: string): Result<Backup, DecodeError> {
  const jsonDecode = parseJsonAsResult(data)
  if (!jsonDecode.ok) {
    return Err(new DecodeError(jsonDecode.error))
  }

  const backup = BackupSchema.decode(jsonDecode.result)
  if (isLeft(backup)) {
    return Err(new DecodeError())
  }

  return Ok(backup.right)
}
