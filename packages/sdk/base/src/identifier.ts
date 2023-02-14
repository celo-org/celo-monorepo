// import { soliditySha3 } from '@celo/utils/lib/solidity'

// const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })

export const PEPPER_SEPARATOR = '__'

/**
 * Standardized prefixes for ODIS identifiers.
 *
 * @remarks These prefixes prevent collisions between off-chain identifiers.
 * i.e. if a user's instagram and twitter handles are the same,
 * these prefixes prevent the ODIS identifers from being the same.
 *
 * If you would like to use a prefix that isn't included, please put up a PR adding it
 * to ensure interoperability with other projects. When adding new prefixes,
 * please use either the full platform name in all lowercase (e.g. 'facebook')
 * or DID methods https://w3c.github.io/did-spec-registries/#did-methods.
 *
 * The NULL prefix is included to allow projects to use the sdk without selecting
 * a predefined prefix or adding their own. Production use of the NULL prefix is
 * discouraged since identifiers will not be interoperable with other projects.
 * Please think carefully before using the NULL prefix.
 */
export enum IdentifierPrefix {
  NULL = '',
  PHONE_NUMBER = 'tel',
  EMAIL = 'mailto',
  TWITTER = 'twit',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  SIGNAL = 'signal',
}

/**
 * Concatenates the identifierPrefix and plaintextIdentifier with the separator '://'
 *
 * @param plaintextIdentifier Off-chain identifier, ex: phone number, twitter handle, email, etc.
 * @param identifierPrefix Standardized prefix used to prevent collisions between identifiers
 */
export const getPrefixedIdentifier = (
  plaintextIdentifier: string,
  identifierPrefix: IdentifierPrefix
): string => identifierPrefix + '://' + plaintextIdentifier

/**
 * Generates final identifier that is published on-chain.
 *
 * @remarks
 * Concatenates the plaintext prefixed identifier with the pepper derived by hashing the unblinded
 * signature returned by ODIS.
 *
 * @param plaintextIdentifier Off-chain identifier, ex: phone number, twitter handle, email, etc.
 * @param identifierPrefix Standardized prefix used to prevent collisions between identifiers
 * @param pepper Hash of the unblinded signature returned by ODIS
 */
export const getIdentifierHash = (
  sha3: (a: string) => string | null,
  plaintextIdentifier: string,
  identifierPrefix: IdentifierPrefix,
  pepper: string
): string => {
  // hashing the identifier before appending the pepper to avoid domain collisions where the
  // identifier may contain underscores
  // not doing this for phone numbers to maintain backwards compatibility
  const value =
    identifierPrefix === IdentifierPrefix.PHONE_NUMBER
      ? getPrefixedIdentifier(plaintextIdentifier, identifierPrefix) + PEPPER_SEPARATOR + pepper
      : (sha3(getPrefixedIdentifier(plaintextIdentifier, identifierPrefix)) as string) +
        PEPPER_SEPARATOR +
        pepper
  return sha3(value) as string
}
