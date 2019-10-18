import { flags } from '@oclif/command'
import { IArg, ParseFn } from '@oclif/parser/lib/args'
import { pathExistsSync } from 'fs-extra'
import Web3 from 'web3'
import { failWith } from './cli'

const parsePublicKey: ParseFn<string> = (input) => {
  // Check that the string starts with 0x and has byte length of ecdsa pub key (64 bytes) + bls pub key (48 bytes) + proof of pos (96 bytes)
  if (Web3.utils.isHex(input) && input.length === 418 && input.startsWith('0x')) {
    return input
  } else {
    return failWith(`${input} is not a public key`)
  }
}
const parseAddress: ParseFn<string> = (input) => {
  if (Web3.utils.isAddress(input)) {
    return input
  } else {
    return failWith(`${input} is not a valid address`)
  }
}

const parsePath: ParseFn<string> = (input) => {
  if (pathExistsSync(input)) {
    return input
  } else {
    return failWith(`File at "${input}" does not exist`)
  }
}

// from http://urlregex.com/
const URL_REGEX = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
)

const parseUrl: ParseFn<string> = (input) => {
  if (URL_REGEX.test(input)) {
    return input
  } else {
    return failWith(`"${input}" is not a valid URL`)
  }
}

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>
type ArgBuilder<T> = (name: string, args?: Partial<Omit<IArg<T>, 'name' | 'parse'>>) => IArg<T>
export function argBuilder<T>(parser: ParseFn<T>): ArgBuilder<T> {
  return (name, args) => ({
    name,
    ...args,
    required: true,
    parse: parser,
  })
}

export const Flags = {
  address: flags.build({
    parse: parseAddress,
    description: 'Account Address',
    helpValue: '0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  }),
  publicKey: flags.build({
    parse: parsePublicKey,
    description: 'Public Key',
    helpValue: '0x',
  }),
  url: flags.build({
    parse: parseUrl,
    description: 'URL',
    helpValue: 'htttps://www.celo.org',
  }),
}

export const Args = {
  address: argBuilder(parseAddress),
  file: argBuilder(parsePath),
  // TODO: Check that the file path is possible
  newFile: argBuilder((x) => x),
}
