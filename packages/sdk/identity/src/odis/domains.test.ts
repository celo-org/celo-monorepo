import {
  EIP712Object,
  generateTypedDataHash,
  noBool,
  noNumber,
  noString,
  some,
} from '@celo/utils/lib/sign-typed-data-utils'
import {
  Domain,
  domainEIP712,
  DomainOptions,
  SequentialDelayDomain,
  SequentialDelayDomainOptions,
} from './domains'

// Compile-time check that Domain can be cast to type EIP712Object
export const TEST_DOMAIN_IS_EIP712: EIP712Object = ({} as unknown) as Domain

// Compile-time check that SequentialDelayDomain can be cast to type Domain
export const TEST_SEQUENTIAL_DELAY_DOMAIN_IS_DOMAIN: Domain = ({} as unknown) as SequentialDelayDomain

// Compile-time check that SequentialDelayDomainOptions can be cast to type EIP712Object
export const TEST_SEQUENTIAL_DELAY_DOMAIN_OPTIONS_ARE_DOMAIN_OPTIONS: DomainOptions = ({} as unknown) as SequentialDelayDomainOptions

describe('domainHash()', () => {
  it('should generate the correct type data for SequentialDelyaDomain instance', () => {
    const domain: SequentialDelayDomain = {
      name: 'ODIS Sequential Delay Domain',
      version: '1',
      stages: [
        { delay: 0, resetTimer: noBool, batchSize: some(2), repetitions: noNumber },
        { delay: 1, resetTimer: some(false), batchSize: noNumber, repetitions: noNumber },
        { delay: 1, resetTimer: some(true), batchSize: noNumber, repetitions: noNumber },
        { delay: 2, resetTimer: some(false), batchSize: noNumber, repetitions: some(1) },
        { delay: 4, resetTimer: noBool, batchSize: some(2), repetitions: some(2) },
      ],
      publicKey: some('0x0000000000000000000000000000000000000b0b'),
      salt: noString,
    }
    const expectedHash = 'a61adacd0ed363bc13f01a993a49f20a6ff0d9d5f577b1496b6f31ae122182f9'
    expect(generateTypedDataHash(domainEIP712(domain)).toString('hex')).toEqual(expectedHash)
  })
})
