# External module: "base/src/io"

## Index

### Variables

* [URL_REGEX](_base_src_io_.md#const-url_regex)

### Functions

* [isValidUrl](_base_src_io_.md#const-isvalidurl)

## Variables

### `Const` URL_REGEX

• **URL_REGEX**: *RegExp‹›* = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
)

*Defined in [packages/base/src/io.ts:2](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/io.ts#L2)*

## Functions

### `Const` isValidUrl

▸ **isValidUrl**(`url`: string): *boolean*

*Defined in [packages/base/src/io.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/io.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |

**Returns:** *boolean*
