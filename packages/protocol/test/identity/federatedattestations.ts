import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  FederatedAttestationsContract,
  FederatedAttestationsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const FederatedAttestations: FederatedAttestationsContract = artifacts.require(
  'FederatedAttestations'
)
const Registry: RegistryContract = artifacts.require('Registry')

contract('FederatedAttestations', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let federatedAttestations: FederatedAttestationsInstance
  let registry: RegistryInstance

  const account1 = accounts[0]
  const issuer1 = accounts[1]
  const phoneNumber: string = '+18005551212'
  const pnIdentifier1 = getPhoneHash(phoneNumber)
  const nowUnixTime = Math.floor(Date.now() / 1000)

  beforeEach('FederatedAttestations setup', async () => {
    accountsInstance = await Accounts.new(true)
    federatedAttestations = await FederatedAttestations.new(true)
    registry = await Registry.new(true)
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(
      CeloContractName.FederatedAttestations,
      federatedAttestations.address
    )
    await federatedAttestations.initialize(registry.address)
  })

  describe('#initialize()', () => {
    it('TODO ASv2', async () => {
      // TODO ASv2
      assert(federatedAttestations)
    })
  })

  describe('#lookupAttestations', () => {
    interface AttestationTestCase {
      account: string
      issuedOn: number
      signer: string
    }

    const checkAgainstExpectedAttestations = (
      expectedAttestations: AttestationTestCase[],
      actualAddresses: string[],
      actualIssuedOns: BigNumber[],
      actualSigners: string[]
    ) => {
      assert.lengthOf(actualAddresses, expectedAttestations.length)
      assert.lengthOf(actualIssuedOns, expectedAttestations.length)
      assert.lengthOf(actualSigners, expectedAttestations.length)

      expectedAttestations.forEach((expectedAttestation, index) => {
        assert.equal(expectedAttestation.account, actualAddresses[index])
        assert.equal(expectedAttestation.issuedOn, actualIssuedOns[index].toNumber())
        assert.equal(expectedAttestation.signer, actualSigners[index])
      })
    }

    describe('when identifier has not been registered', () => {
      it('should return empty list', async () => {
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          pnIdentifier1,
          [issuer1],
          1
        )
        checkAgainstExpectedAttestations([], addresses, issuedOns, signers)
      })
    })

    describe('when identifier has been registered', () => {
      const account2 = accounts[2]

      const issuer2 = accounts[3]
      const issuer3 = accounts[4]
      const issuer2Signer = accounts[5]

      const issuer1Attestations: AttestationTestCase[] = [
        {
          account: account1,
          issuedOn: nowUnixTime,
          signer: issuer1,
        },
        // Same issuer as [0], different account
        {
          account: account2,
          issuedOn: nowUnixTime,
          signer: issuer1,
        },
      ]
      const issuer2Attestations: AttestationTestCase[] = [
        // Same account as issuer1Attestations[0], different issuer
        {
          account: account1,
          issuedOn: nowUnixTime,
          signer: issuer2,
        },
        // Different account and signer
        {
          account: account2,
          issuedOn: nowUnixTime,
          signer: issuer2Signer,
        },
      ]

      beforeEach(async () => {
        for (const { issuer, attestationsPerIssuer } of [
          { issuer: issuer1, attestationsPerIssuer: issuer1Attestations },
          { issuer: issuer2, attestationsPerIssuer: issuer2Attestations },
        ]) {
          for (const attestation of attestationsPerIssuer) {
            // Require consistent order for test cases
            await federatedAttestations.registerAttestation(pnIdentifier1, issuer, attestation, {
              from: attestation.account,
            })
          }
        }
      })

      it('should return all attestations from one issuer', async () => {
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          pnIdentifier1,
          [issuer1],
          // Do not allow for maxAttestations to coincidentally limit incorrect output
          issuer1Attestations.length + 1
        )
        checkAgainstExpectedAttestations(issuer1Attestations, addresses, issuedOns, signers)
      })

      it('should return empty list if no attestations exist for an issuer', async () => {
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          pnIdentifier1,
          [issuer3],
          1
        )
        checkAgainstExpectedAttestations([], addresses, issuedOns, signers)
      })

      it('should return attestations from multiple issuers in correct order', async () => {
        const expectedAttestations = issuer2Attestations.concat(issuer1Attestations)
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          pnIdentifier1,
          [issuer3, issuer2, issuer1],
          expectedAttestations.length + 1
        )
        checkAgainstExpectedAttestations(expectedAttestations, addresses, issuedOns, signers)
      })

      it('should return empty list if maxAttestations == 0', async () => {
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          pnIdentifier1,
          [issuer1],
          0
        )
        checkAgainstExpectedAttestations([], addresses, issuedOns, signers)
      })

      it('should only return maxAttestations attestations when more are present', async () => {
        const expectedAttestations = issuer1Attestations.slice(0, -1)
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          pnIdentifier1,
          [issuer1],
          expectedAttestations.length
        )
        checkAgainstExpectedAttestations(expectedAttestations, addresses, issuedOns, signers)
      })

      it('should not return attestations from revoked signers', async () => {
        const attestationToRevoke = issuer2Attestations[0]
        await federatedAttestations.revokeSigner(
          attestationToRevoke.signer,
          attestationToRevoke.issuedOn - 1
        )
        const expectedAttestations = issuer2Attestations.slice(1)

        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          pnIdentifier1,
          [issuer2],
          issuer2Attestations.length
        )
        checkAgainstExpectedAttestations(expectedAttestations, addresses, issuedOns, signers)
      })
    })
  })

  describe('#lookupIdentifiersByAddress', () => {
    describe('when address has not been registered', () => {
      it('should return empty list', async () => {
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer1],
          1
        )
        assert.equal(actualIdentifiers.length, 0)
      })
    })

    describe('when address has been registered', () => {
      interface IdentifierTestCase {
        pnIdentifier: string
        signer: string
      }

      const checkAgainstExpectedIdCases = (
        expectedIdentifiers: IdentifierTestCase[],
        actualIdentifiers: string[]
      ) => {
        expect(expectedIdentifiers.map((idCase) => idCase.pnIdentifier)).to.eql(actualIdentifiers)
      }

      const issuer2 = accounts[2]
      const issuer2Signer = accounts[3]
      const issuer3 = accounts[4]
      const pnIdentifier2 = getPhoneHash(phoneNumber, 'dummySalt')

      const issuer1IdCases: IdentifierTestCase[] = [
        {
          pnIdentifier: pnIdentifier1,
          signer: issuer1,
        },
        {
          pnIdentifier: pnIdentifier2,
          signer: issuer1,
        },
      ]
      const issuer2IdCases: IdentifierTestCase[] = [
        {
          pnIdentifier: pnIdentifier1,
          signer: issuer2,
        },
        {
          pnIdentifier: pnIdentifier2,
          signer: issuer2Signer,
        },
      ]

      beforeEach(async () => {
        // Require consistent order for test cases
        for (const { issuer, idCasesPerIssuer } of [
          { issuer: issuer1, idCasesPerIssuer: issuer1IdCases },
          { issuer: issuer2, idCasesPerIssuer: issuer2IdCases },
        ]) {
          for (const idCase of idCasesPerIssuer) {
            const attestation = {
              account: account1,
              issuedOn: nowUnixTime,
              signer: idCase.signer,
            }
            await federatedAttestations.registerAttestation(
              idCase.pnIdentifier,
              issuer,
              attestation,
              {
                from: attestation.account,
              }
            )
          }
        }
      })

      it('should return all identifiers from one issuer', async () => {
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer1],
          issuer1IdCases.length + 1
        )
        checkAgainstExpectedIdCases(issuer1IdCases, actualIdentifiers)
      })

      it('should return empty list if no identifiers exist for an (issuer,address)', async () => {
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer3],
          1
        )
        assert.equal(actualIdentifiers.length, 0)
      })

      it('should return identifiers from multiple issuers in correct order', async () => {
        const expectedIdCases = issuer2IdCases.concat(issuer1IdCases)
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer3, issuer2, issuer1],
          expectedIdCases.length + 1
        )
        checkAgainstExpectedIdCases(expectedIdCases, actualIdentifiers)
      })

      it('should return empty list if maxIdentifiers == 0', async () => {
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer1],
          0
        )
        assert.equal(actualIdentifiers.length, 0)
      })

      it('should only return maxIdentifiers identifiers when more are present', async () => {
        const expectedIdCases = issuer2IdCases.concat(issuer1IdCases).slice(0, -1)
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer2, issuer1],
          expectedIdCases.length
        )
        checkAgainstExpectedIdCases(expectedIdCases, actualIdentifiers)
      })

      it('should not return identifiers from revoked signers', async () => {
        await federatedAttestations.revokeSigner(issuer2IdCases[0].signer, nowUnixTime)
        const expectedIdCases = issuer2IdCases.slice(1)
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer2],
          expectedIdCases.length + 1
        )
        checkAgainstExpectedIdCases(expectedIdCases, actualIdentifiers)
      })
    })
  })

  describe('#validateAttestation', () => {
    it('should', async () => {})
  })

  describe('#registerAttestation', () => {
    it('should', async () => {})
  })

  describe('#deleteAttestation', () => {
    it('should', async () => {})
  })
})
