import threshold_bls from 'blind-threshold-bls'

require('dotenv').config()

export function getBlindedPhoneNumber(phoneNumber: string, blindingFactor: Buffer): string {
  const blindedPhoneNumber = threshold_bls.blind(Buffer.from(phoneNumber), blindingFactor).message
  return Buffer.from(blindedPhoneNumber).toString('base64')
}

export type E2ETestParams = {
  blockchainProviderURL: string
  pnpPolynomial: string
  pnpKeyVersion: string
  domainsPolynomial: string
  domainsPubKey: string
  domainsKeyVersion: string
}

// Once context-specific params are located in the common package,
// consider using that instead of redefining the specifics here.
export function getTestParamsForContext(): E2ETestParams {
  switch (process.env.CONTEXT_NAME) {
    case 'staging':
      return {
        blockchainProviderURL: process.env.STAGING_ODIS_BLOCKCHAIN_PROVIDER!,
        pnpPolynomial: process.env.STAGING_POLYNOMIAL!,
        pnpKeyVersion: process.env.ODIS_PNP_TEST_KEY_VERSION!,
        domainsPolynomial: process.env.STAGING_POLYNOMIAL!,
        domainsPubKey: process.env.STAGING_DOMAINS_PUBKEY!,
        domainsKeyVersion: process.env.ODIS_DOMAINS_TEST_KEY_VERSION!,
      }
    case 'alfajores':
      return {
        blockchainProviderURL: process.env.ALFAJORES_ODIS_BLOCKCHAIN_PROVIDER!,
        pnpPolynomial: process.env.ALFAJORES_PHONE_NUMBER_PRIVACY_POLYNOMIAL!,
        pnpKeyVersion: process.env.ODIS_PNP_TEST_KEY_VERSION!,
        domainsPolynomial: process.env.ALFAJORES_DOMAINS_POLYNOMIAL!,
        domainsPubKey: process.env.ALFAJORES_DOMAINS_PUBKEY!,
        domainsKeyVersion: process.env.ODIS_DOMAINS_TEST_KEY_VERSION!,
      }
    case 'mainnet':
      return {
        blockchainProviderURL: process.env.MAINNET_ODIS_BLOCKCHAIN_PROVIDER!,
        pnpPolynomial: process.env.MAINNET_PHONE_NUMBER_PRIVACY_POLYNOMIAL!,
        pnpKeyVersion: process.env.ODIS_PNP_TEST_KEY_VERSION!,
        domainsPolynomial: process.env.MAINNET_DOMAINS_POLYNOMIAL!,
        domainsPubKey: process.env.MAINNET_DOMAINS_PUBKEY!,
        domainsKeyVersion: process.env.ODIS_DOMAINS_TEST_KEY_VERSION!,
      }
    default:
      throw new Error(`No parameter settings stored for context: ${process.env.CONTEXT_NAME}`)
  }
}
