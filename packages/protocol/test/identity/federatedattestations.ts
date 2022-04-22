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

  const caller: string = accounts[0]
  const phoneNumber: string = '+18005551212'
  // TODO ASv2 possibly rename to pnIdentifier
  const phoneHash: string = getPhoneHash(phoneNumber)

  const getCurrentUnixTime = () => Math.floor(Date.now() / 1000)

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
      assert(caller)
      assert(federatedAttestations)
    })
  })

  describe('#lookupAttestations', () => {
    const issuer1 = accounts[1]
    const nowUnixTime = getCurrentUnixTime()
    const issuer2 = accounts[2]
    const issuer3 = accounts[3]
    const caller2 = accounts[4]
    const issuer2Signer = accounts[5]

    type testAttestation = {
      account: string
      issuedOn: number
      signer: string
    }

    const issuer1Attestations: testAttestation[] = [
      {
        account: caller,
        issuedOn: nowUnixTime,
        signer: issuer1,
      },
      // Same issuer as [0], different account
      {
        account: caller2,
        issuedOn: nowUnixTime,
        signer: issuer1,
      },
    ]

    const issuer2Attestations: testAttestation[] = [
      // Same account as issuer1Attestations[0], different issuer
      {
        account: caller,
        issuedOn: nowUnixTime,
        signer: issuer2,
      },
      // Different account and signer
      {
        account: caller2,
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
          await federatedAttestations.registerAttestation(phoneHash, issuer, attestation, {
            from: attestation.account,
          })
        }
      }
    })

    const runLookupAttestationsTestCase = async (
      phoneHash: string,
      trustedIssuers: string[],
      maxAttestations: number,
      expectedAttestations: testAttestation[]
    ) => {
      const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
        phoneHash,
        trustedIssuers,
        maxAttestations
      )
      checkAgainstExpectedAttestations(expectedAttestations, addresses, issuedOns, signers)
    }

    const checkAgainstExpectedAttestations = (
      expectedAttestations: testAttestation[],
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

    it('should return all attestations from one issuer', async () => {
      await runLookupAttestationsTestCase(
        phoneHash,
        [issuer1],
        issuer1Attestations.length,
        issuer1Attestations
      )
    })

    it('should return attestations from multiple issuers', async () => {
      const expectedAttestations = issuer1Attestations.concat(issuer2Attestations)
      await runLookupAttestationsTestCase(
        phoneHash,
        [issuer1, issuer2],
        expectedAttestations.length,
        expectedAttestations
      )
    })
    it('should return attestations ordered by issuer', async () => {
      const expectedAttestations = issuer2Attestations.concat(issuer1Attestations)
      await runLookupAttestationsTestCase(
        phoneHash,
        [issuer2, issuer1],
        expectedAttestations.length,
        expectedAttestations
      )
    })
    it('should return empty list if maxAttestations == 0', async () => {
      await runLookupAttestationsTestCase(phoneHash, [issuer1], 0, [])
    })
    it('should succeed when maxAttestations > available attestations', async () => {
      await runLookupAttestationsTestCase(
        phoneHash,
        [issuer1],
        issuer1Attestations.length + 1,
        issuer1Attestations
      )
    })
    it('should only return maxAttestations attestations when more are present', async () => {
      const expectedAttestations = issuer1Attestations.slice(0, -1)
      await runLookupAttestationsTestCase(
        phoneHash,
        [issuer1],
        expectedAttestations.length,
        expectedAttestations
      )
    })
    it('should return none if no attestations exist for an issuer', async () => {
      await runLookupAttestationsTestCase(phoneHash, [issuer3], 0, [])
    })
    it('should not return attestations from revoked signers', async () => {
      const attestationToRevoke = issuer2Attestations[1]
      const revokedOn = attestationToRevoke.issuedOn - 10
      await federatedAttestations.revokeSigner(attestationToRevoke.signer, revokedOn)
      const expectedAttestations = issuer2Attestations.filter(
        (attestation) =>
          attestation.signer != attestationToRevoke.signer || attestation.issuedOn < revokedOn
      )
      await runLookupAttestationsTestCase(
        phoneHash,
        [issuer2],
        issuer2Attestations.length, // Do not limit by maxAttestations
        expectedAttestations
      )
    })
  })

  describe('#lookupIdentifiersByAddress', () => {
    it('should', async () => {})
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
