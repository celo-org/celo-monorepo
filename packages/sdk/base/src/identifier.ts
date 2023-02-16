export const PEPPER_SEPARATOR = '__'

/**
 * Standardized prefixes for ODIS identifiers.
 * Used in @celo/identity, @celo/phone-utils, and the protocol package.
 *
 * When adding prefixes, make sure to add the expected value for the unit test case
 * in identifier.test.ts, otherwise the test will fail.
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
 * Helper function for getIdentifierHash in @celo/identity, so that this can
 * be used in protocol tests without dependency issues.
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
