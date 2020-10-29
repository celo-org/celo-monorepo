import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { BLS_POP_SIZE, BLS_PUBLIC_KEY_SIZE } from '@celo/utils/lib/bls'
import { URL_REGEX } from '@celo/utils/lib/io'
import { isE164NumberStrict } from '@celo/utils/lib/phoneNumbers'
import { POP_SIZE } from '@celo/utils/lib/signatureUtils'
import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'
import { IArg, ParseFn } from '@oclif/parser/lib/args'
import BigNumber from 'bignumber.js'
import { pathExistsSync } from 'fs-extra'
import Web3 from 'web3'

const parseBytes = (input: string, length: number, msg: string) => {
  // Check that the string is hex and and has byte length of `length`.
  const expectedLength = input.startsWith('0x') ? length * 2 + 2 : length * 2
  if (Web3.utils.isHex(input) && input.length === expectedLength) {
    return ensureLeading0x(input)
  } else {
    throw new CLIError(msg)
  }
}

const parseEcdsaPublicKey: ParseFn<string> = (input) => {
  const stripped = trimLeading0x(input)
  // ECDSA public keys may be passed as 65 byte values. When this happens, we drop the first byte.
  if (stripped.length === 65 * 2) {
    return parseBytes(stripped.slice(2), 64, `${input} is not an ECDSA public key`)
  } else {
    return parseBytes(input, 64, `${input} is not an ECDSA public key`)
  }
}
const parseBlsPublicKey: ParseFn<string> = (input) => {
  return parseBytes(input, BLS_PUBLIC_KEY_SIZE, `${input} is not a BLS public key`)
}
const parseBlsProofOfPossession: ParseFn<string> = (input) => {
  return parseBytes(input, BLS_POP_SIZE, `${input} is not a BLS proof-of-possession`)
}
const parseProofOfPossession: ParseFn<string> = (input) => {
  return parseBytes(input, POP_SIZE, `${input} is not a proof-of-possession`)
}
const parseAddress: ParseFn<string> = (input) => {
  if (Web3.utils.isAddress(input)) {
    return input
  } else {
    throw new CLIError(`${input} is not a valid address`)
  }
}

const parseWei: ParseFn<BigNumber> = (input) => {
  try {
    return new BigNumber(input)
  } catch (_err) {
    throw new CLIError(`${input} is not a valid token amount`)
  }
}

export const parsePath: ParseFn<string> = (input) => {
  if (pathExistsSync(input)) {
    return input
  } else {
    throw new CLIError(`File at "${input}" does not exist`)
  }
}

const parsePhoneNumber: ParseFn<string> = (input) => {
  if (isE164NumberStrict(input)) {
    return input
  } else {
    throw new CLIError(`PhoneNumber "${input}" is not a valid E164 number`)
  }
}

const parseUrl: ParseFn<string> = (input) => {
  if (URL_REGEX.test(input)) {
    return input
  } else {
    throw new CLIError(`"${input}" is not a valid URL`)
  }
}

function parseArray<T>(parseElement: ParseFn<T>): ParseFn<T[]> {
  return (input) => {
    const array = JSON.parse(input)
    if (Array.isArray(array)) {
      return array.map(parseElement)
    } else {
      throw new CLIError(`"${input}" is not a valid array`)
    }
  }
}

export const parseIntArray = parseArray(flags.integer().parse as ParseFn<number>)
export const parseAddressArray = parseArray(parseAddress)

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
  intArray: flags.build({
    parse: parseIntArray,
    helpValue: '"[0, 1, 99]"',
  }),
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
  phoneNumber: flags.build({
    parse: parsePhoneNumber,
    description: 'Phone Number in E164 Format',
    helpValue: '+14152223333',
  }),
  proofOfPossession: flags.build({
    parse: parseProofOfPossession,
    description: 'Proof-of-Possession',
    helpValue: '0x',
  }),
  url: flags.build({
    parse: parseUrl,
    description: 'URL',
    helpValue: 'https://www.celo.org',
  }),
  wei: flags.build({
    parse: parseWei,
    description: 'Token value without decimals',
    helpValue: '10000000000000000000000',
  }),
}

export const Args = {
  address: argBuilder(parseAddress),
  file: argBuilder(parsePath),
  // TODO: Check that the file path is possible
  newFile: argBuilder((x) => x),
}
