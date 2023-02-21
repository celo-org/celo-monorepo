// These functions were moved from the identity SDK because the protocol package
// and @celo/phone-utils both need these core identifier generation functions as well.
// The protocol package cannot depend on the identity SDK as is since this creates
// a non-trivial dependency cycle (currently, if A->B means "A depends on B",
// identity -> phone-number-privacy-common -> contractkit -> protocol).

export const PEPPER_SEPARATOR = '__'

// Docstring is duplicated in @celo/identity; make sure to update in both places.
/**
 * Standardized prefixes for ODIS identifiers.
 *
 * @remarks These prefixes prevent collisions between off-chain identifiers.
 * i.e. if a user's instagram and twitter handles are the same,
 * these prefixes prevent the ODIS identifers from being the same.
 *
 * If you would like to use a prefix that isn't included, please put up a PR
 * adding it to @celo/base (in celo-monorepo/packages/sdk/base/src/identifier.ts)
 * to ensure interoperability with other projects. When adding new prefixes,
 * please use either the full platform name in all lowercase (e.g. 'facebook')
 * or DID methods https://w3c.github.io/did-spec-registries/#did-methods.
 * Make sure to add the expected value for the unit test case in
 * `celo-monorepo/packages/sdk/base/src/identifier.test.ts`,
 * otherwise the test will fail.
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

// Docstring is duplicated in @celo/identity; make sure to update in both places.
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
 *
 * @remarks
 * Concatenates the plaintext prefixed identifier with the pepper derived by hashing the unblinded
 * signature returned by ODIS.
 *
 * @param sha3 Hash function (i.e. soliditySha3) to use to generate the identifier
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
