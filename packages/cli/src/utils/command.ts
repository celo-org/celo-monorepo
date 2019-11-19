import { BLS_POP_SIZE, BLS_PUBLIC_KEY_SIZE } from '@celo/utils/lib/bls'
import { URL_REGEX } from '@celo/utils/lib/io'
import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'
import { IArg, ParseFn } from '@oclif/parser/lib/args'
import { pathExistsSync } from 'fs-extra'
import Web3 from 'web3'

const parseBytes = (input: string, length: number, msg: string) => {
  // Check that the string starts with 0x and has byte length of `length`.
  if (Web3.utils.isHex(input) && input.length === length && input.startsWith('0x')) {
    return input
  } else {
    throw new CLIError(msg)
  }
}

const parseEcdsaPublicKey: ParseFn<string> = (input) => {
  return parseBytes(input, 64, `${input} is not an ECDSA public key`)
}
const parseBlsPublicKey: ParseFn<string> = (input) => {
  return parseBytes(input, BLS_PUBLIC_KEY_SIZE, `${input} is not a BLS public key`)
}
const parseBlsProofOfPossession: ParseFn<string> = (input) => {
  return parseBytes(input, BLS_POP_SIZE, `${input} is not a BLS proof-of-possession`)
}
const parseAddress: ParseFn<string> = (input) => {
  if (Web3.utils.isAddress(input)) {
    return input
  } else {
    throw new CLIError(`${input} is not a valid address`)
  }
}

const parsePath: ParseFn<string> = (input) => {
  if (pathExistsSync(input)) {
    return input
  } else {
    throw new CLIError(`File at "${input}" does not exist`)
  }
}

const parseUrl: ParseFn<string> = (input) => {
  if (URL_REGEX.test(input)) {
    return input
  } else {
    throw new CLIError(`"${input}" is not a valid URL`)
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
  ecdsaPublicKey: flags.build({
    parse: parseEcdsaPublicKey,
    description: 'ECDSA Public Key',
    helpValue: '0x',
  }),
  blsPublicKey: flags.build({
    parse: parseBlsPublicKey,
    description: 'BLS Public Key',
    helpValue: '0x',
  }),
  blsProofOfPossession: flags.build({
    parse: parseBlsProofOfPossession,
    description: 'BLS Proof-of-Possession',
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
