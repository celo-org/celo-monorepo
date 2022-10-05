[@celo/encrypted-backup](../README.md) › ["schema"](_schema_.md)

# Module: "schema"

## Index

### Variables

* [BackupSchema](_schema_.md#const-backupschema)
* [BufferFromBase64](_schema_.md#const-bufferfrombase64)

### Functions

* [deserializeBackup](_schema_.md#deserializebackup)
* [serializeBackup](_schema_.md#serializebackup)

## Variables

### `Const` BackupSchema

• **BackupSchema**: *Type‹[Backup](../interfaces/_backup_.backup.md), object›* = t.intersection([
  // Required fields
  t.type({
    encryptedData: BufferFromBase64,
    nonce: BufferFromBase64,
    version: t.string,
  }),
  // Optional fields
  // https://github.com/gcanti/io-ts/blob/master/index.md#mixing-required-and-optional-props
  t.partial({
    odisDomain: SequentialDelayDomainSchema,
    metadata: t.UnknownRecord,
    encryptedFuseKey: BufferFromBase64,
    computationalHardening: t.union([
      t.type({
        function: t.literal(ComputationalHardeningFunction.PBKDF),
        iterations: t.number,
      }),
      t.intersection([
        t.type({
          function: t.literal(ComputationalHardeningFunction.SCRYPT),
          cost: t.number,
        }),
        t.partial({
          blockSize: t.number,
          parallelization: t.number,
        }),
      ]),
    ]),
    environment: t.partial({
      odis: t.type({
        odisUrl: t.string,
        odisPubKey: t.string,
      }),
      circuitBreaker: t.type({
        url: t.string,
        publicKey: t.string,
      }),
    }),
  }),
])

*Defined in [packages/sdk/encrypted-backup/src/schema.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/schema.ts#L31)*

io-ts codec used to encode and decode backups from JSON objects

___

### `Const` BufferFromBase64

• **BufferFromBase64**: *Type‹Buffer‹›, string, unknown›* = new t.Type<Buffer, string, unknown>(
  'BufferFromBase64',
  Buffer.isBuffer,
  (unk: unknown, context: t.Context) =>
    pipe(
      t.string.validate(unk, context),
      chain((str: string) => {
        // Check that the string is base64 data and return the decoding if it is.
        if (!BASE64_REGEXP.test(str)) {
          return t.failure(unk, context, 'provided string is not base64')
        }
        return t.success(Buffer.from(str, 'base64'))
      })
    ),
  (buffer: Buffer) => buffer.toString('base64')
)

*Defined in [packages/sdk/encrypted-backup/src/schema.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/schema.ts#L13)*

Utility type to leverage io-ts for encoding and decoding of buffers from base64 strings.

## Functions

###  deserializeBackup

▸ **deserializeBackup**(`data`: string): *Result‹[Backup](../interfaces/_backup_.backup.md), [DecodeError](../classes/_errors_.decodeerror.md)›*

*Defined in [packages/sdk/encrypted-backup/src/schema.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/schema.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Result‹[Backup](../interfaces/_backup_.backup.md), [DecodeError](../classes/_errors_.decodeerror.md)›*

___

###  serializeBackup

▸ **serializeBackup**(`backup`: [Backup](../interfaces/_backup_.backup.md)): *string*

*Defined in [packages/sdk/encrypted-backup/src/schema.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/schema.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`backup` | [Backup](../interfaces/_backup_.backup.md) |

**Returns:** *string*
