import {
  defined,
  EIP712Object,
  generateTypedDataHash,
  noBool,
  noNumber,
  noString,
} from '@celo/utils/lib/sign-typed-data-utils'
import {
  Domain,
  domainEIP712,
  DomainOptions,
  KnownDomain,
  KnownDomainOptions,
  SequentialDelayDomain,
  SequentialDelayDomainOptions,
} from './domains'

// Compile-time check that Domain can be cast to type EIP712Object
export const TEST_DOMAIN_IS_EIP712: EIP712Object = ({} as unknown) as Domain

// Compile-time check that SequentialDelayDomain can be cast to type Domain
export const TEST_SEQUENTIAL_DELAY_DOMAIN_IS_DOMAIN: Domain = ({} as unknown) as SequentialDelayDomain

// Compile-time check that SequentialDelayDomainOptions can be cast to type DomainOptions.
export const TEST_SEQUENTIAL_DELAY_DOMAIN_OPTIONS_ARE_DOMAIN_OPTIONS: DomainOptions = ({} as unknown) as SequentialDelayDomainOptions

// Compile-time check that KnownDomain can be cast to type Domain.
export const TEST_KNOWN_DOMAIN_IS_DOMAIN: Domain = ({} as unknown) as KnownDomain

// Compile-time check that KnownDomainOptions can be cast to type DomainOptions.
export let TEST_KNOWN_DOMAIN_DOMAIN_OPTIONS_ARE_DOMAIN_OPTIONS: DomainOptions
TEST_KNOWN_DOMAIN_DOMAIN_OPTIONS_ARE_DOMAIN_OPTIONS = ({} as unknown) as KnownDomainOptions
TEST_KNOWN_DOMAIN_DOMAIN_OPTIONS_ARE_DOMAIN_OPTIONS = ({} as unknown) as KnownDomainOptions<SequentialDelayDomain>

describe('domainEIP712()', () => {
  it('should generate the correct type data for SequentialDelayDomain instance', () => {
    const domain: SequentialDelayDomain = {
      name: 'ODIS Sequential Delay Domain',
      version: '1',
      stages: [
        { delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: noNumber },
        { delay: 1, resetTimer: defined(false), batchSize: noNumber, repetitions: noNumber },
        { delay: 1, resetTimer: defined(true), batchSize: noNumber, repetitions: noNumber },
        { delay: 2, resetTimer: defined(false), batchSize: noNumber, repetitions: defined(1) },
        { delay: 4, resetTimer: noBool, batchSize: defined(2), repetitions: defined(2) },
      ],
      address: defined('0x0000000000000000000000000000000000000b0b'),
      salt: noString,
    }
    const expectedHash = '966edacc6cdf76b4536da958e82e360213b957508767a393ccf5c6b73db241d1'
    const typedData = domainEIP712(domain)
    // console.debug(JSON.stringify(typedData, null, 2))
    expect(generateTypedDataHash(typedData).toString('hex')).toEqual(expectedHash)
  })
})
