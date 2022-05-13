import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import {
  getDomainDigest,
  getSignatureForAttestation,
} from '@celo/protocol/lib/fed-attestations-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertLogMatches2,
  assertRevert,
  assertRevertWithReason,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  FederatedAttestationsContract,
  FederatedAttestationsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'
import { keccak256 } from 'web3-utils'

const Accounts: AccountsContract = artifacts.require('Accounts')
const FederatedAttestations: FederatedAttestationsContract = artifacts.require(
  'FederatedAttestations'
)
const Registry: RegistryContract = artifacts.require('Registry')

contract('FederatedAttestations', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let federatedAttestations: FederatedAttestationsInstance
  let registry: RegistryInstance
  let initialize

  const chainId = 1

  const issuer1 = accounts[0]
  const signer1 = accounts[1]
  const account1 = accounts[2]

  const phoneNumber: string = '+18005551212'
  const identifier1 = getPhoneHash(phoneNumber)
  const identifier2 = getPhoneHash(phoneNumber, 'dummySalt')

  const nowUnixTime = Math.floor(Date.now() / 1000)

  const signerRole = keccak256('celo.org/core/attestation')
  let sig

  const signAndRegisterAttestation = async (
    identifier: string,
    issuer: string, // Must be a registered account
    account: string,
    issuedOn: number,
    signer: string
  ) => {
    const attestationSignature = await getSignatureForAttestation(
      identifier,
      issuer,
      account,
      issuedOn,
      signer,
      chainId,
      federatedAttestations.address
    )
    if (issuer !== signer && !(await accountsInstance.isSigner(issuer, signer, signerRole))) {
      await accountsInstance.authorizeSigner(signer, signerRole, {
        from: issuer,
      })
      await accountsInstance.completeSignerAuthorization(issuer, signerRole, {
        from: signer,
      })
    }
    await federatedAttestations.registerAttestation(
      identifier,
      issuer,
      account,
      issuedOn,
      signer,
      attestationSignature.v,
      attestationSignature.r,
      attestationSignature.s,
      {
        from: issuer,
      }
    )
  }

  beforeEach('FederatedAttestations setup', async () => {
    accountsInstance = await Accounts.new(true)
    federatedAttestations = await FederatedAttestations.new(true)
    registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(
      CeloContractName.FederatedAttestations,
      federatedAttestations.address
    )
    initialize = await federatedAttestations.initialize(registry.address)

    await accountsInstance.createAccount({ from: issuer1 })
    sig = await getSignatureForAttestation(
      identifier1,
      issuer1,
      account1,
      nowUnixTime,
      signer1,
      chainId,
      federatedAttestations.address
    )
  })

  describe('#EIP712_VALIDATE_ATTESTATION_TYPEHASH()', () => {
    it('should have set the right typehash', async () => {
      const expectedTypehash = keccak256(
        'OwnershipAttestation(bytes32 identifier,address issuer,address account,uint256 issuedOn)'
      )
      assert.equal(
        await federatedAttestations.EIP712_VALIDATE_ATTESTATION_TYPEHASH(),
        expectedTypehash
      )
    })
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await federatedAttestations.owner()
      assert.equal(owner, issuer1)
    })

    it('should have set the registry address', async () => {
      const registryAddress: string = await federatedAttestations.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should have set the EIP-712 domain separator', async () => {
      assert.equal(
        await federatedAttestations.eip712DomainSeparator(),
        getDomainDigest(federatedAttestations.address)
      )
    })

    it('should emit the EIP712DomainSeparatorSet event', () => {
      assertLogMatches2(initialize.logs[2], {
        event: 'EIP712DomainSeparatorSet',
        args: {
          eip712DomainSeparator: getDomainDigest(federatedAttestations.address),
        },
      })
    })

    it('should not be callable again', async () => {
      await assertRevert(federatedAttestations.initialize(registry.address))
    })
  })

  // TODO EN: move this up; possibly contain this in a describe block as needed?
  // TODO EN: possibly move this into fed-attestations-utils?
  interface AttestationTestCase {
    account: string
    issuedOn: number
    signer: string
  }

  const checkAgainstExpectedAttestations = (
    expectedCountsPerIssuer: number[],
    expectedAttestations: AttestationTestCase[],
    actualCountsPerIssuer: BigNumber[],
    actualAddresses: string[],
    actualIssuedOns: BigNumber[],
    actualSigners: string[]
  ) => {
    expect(actualCountsPerIssuer.map((count) => count.toNumber())).to.eql(expectedCountsPerIssuer)

    assert.lengthOf(actualAddresses, expectedAttestations.length)
    assert.lengthOf(actualIssuedOns, expectedAttestations.length)
    assert.lengthOf(actualSigners, expectedAttestations.length)

    expectedAttestations.forEach((expectedAttestation, index) => {
      assert.equal(actualAddresses[index], expectedAttestation.account)
      assert.equal(actualIssuedOns[index].toNumber(), expectedAttestation.issuedOn)
      assert.equal(actualSigners[index], expectedAttestation.signer)
    })
  }

  const checkAgainstExpectedCountsPerIssuer = (
    expectedCountsPerIssuer: number[],
    actualTotal: BigNumber,
    actualCountsPerIssuer: BigNumber[]
  ) => {
    const expectedTotal = expectedCountsPerIssuer.reduce((sum, prev) => sum + prev, 0)
    assert.equal(actualTotal.toNumber(), expectedTotal)
    expect(actualCountsPerIssuer.map((count) => count.toNumber())).to.eql(expectedCountsPerIssuer)
  }

  describe('#lookupAttestations', () => {
    describe('when identifier has not been registered', () => {
      it('should return empty list', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAttestations(identifier1, [issuer1], 1)
        checkAgainstExpectedAttestations([0], [], countsPerIssuer, addresses, issuedOns, signers)
      })
    })

    describe('when identifier has been registered', () => {
      const account2 = accounts[3]

      const issuer2 = accounts[4]
      const issuer2Signer = accounts[5]
      const issuer2Signer2 = accounts[6]
      const issuer3 = accounts[7]

      const issuer1Attestations: AttestationTestCase[] = [
        {
          account: account1,
          issuedOn: nowUnixTime,
          signer: signer1,
        },
        // Same issuer as [0], different account
        {
          account: account2,
          issuedOn: nowUnixTime,
          signer: signer1,
        },
      ]
      const issuer2Attestations: AttestationTestCase[] = [
        // Same account as issuer1Attestations[0], different issuer
        {
          account: account1,
          issuedOn: nowUnixTime,
          signer: issuer2Signer,
        },
        // Different account and signer
        {
          account: account2,
          issuedOn: nowUnixTime,
          signer: issuer2Signer2,
        },
      ]

      beforeEach(async () => {
        // Require consistent order for test cases
        await accountsInstance.createAccount({ from: issuer2 })
        for (const { issuer, attestationsPerIssuer } of [
          { issuer: issuer1, attestationsPerIssuer: issuer1Attestations },
          { issuer: issuer2, attestationsPerIssuer: issuer2Attestations },
        ]) {
          for (const attestation of attestationsPerIssuer) {
            await signAndRegisterAttestation(
              identifier1,
              issuer,
              attestation.account,
              attestation.issuedOn,
              attestation.signer
            )
          }
        }
      })

      it('should return empty count if no issuers specified', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAttestations(identifier1, [], 1)
        checkAgainstExpectedAttestations([], [], countsPerIssuer, addresses, issuedOns, signers)
      })

      it('should return all attestations from one issuer', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAttestations(
          identifier1,
          [issuer1],
          // Do not allow for maxAttestations to coincidentally limit incorrect output
          issuer1Attestations.length + 1
        )
        checkAgainstExpectedAttestations(
          [issuer1Attestations.length],
          issuer1Attestations,
          countsPerIssuer,
          addresses,
          issuedOns,
          signers
        )
      })

      it('should return empty list if no attestations exist for an issuer', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAttestations(identifier1, [issuer3], 1)
        checkAgainstExpectedAttestations([0], [], countsPerIssuer, addresses, issuedOns, signers)
      })

      it('should return attestations from multiple issuers in correct order', async () => {
        const expectedAttestations = issuer2Attestations.concat(issuer1Attestations)
        const expectedCountsPerIssuer = [0, issuer2Attestations.length, issuer1Attestations.length]
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAttestations(
          identifier1,
          [issuer3, issuer2, issuer1],
          expectedAttestations.length + 1
        )
        checkAgainstExpectedAttestations(
          expectedCountsPerIssuer,
          expectedAttestations,
          countsPerIssuer,
          addresses,
          issuedOns,
          signers
        )
      })

      it('should return empty list if maxAttestations == 0', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAttestations(identifier1, [issuer1], 0)
        checkAgainstExpectedAttestations([0], [], countsPerIssuer, addresses, issuedOns, signers)
      })

      it('should only return maxAttestations attestations when more are present', async () => {
        const expectedAttestations = issuer1Attestations.slice(0, -1)
        const expectedCountsPerIssuer = [expectedAttestations.length]
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAttestations(
          identifier1,
          [issuer1],
          expectedAttestations.length
        )
        checkAgainstExpectedAttestations(
          expectedCountsPerIssuer,
          expectedAttestations,
          countsPerIssuer,
          addresses,
          issuedOns,
          signers
        )
      })

      it('should not return attestations from revoked signers', async () => {
        const attestationToRevoke = issuer2Attestations[0]
        await federatedAttestations.revokeSigner(attestationToRevoke.signer)
        const expectedAttestations = issuer2Attestations.slice(1)
        const expectedCountsPerIssuer = [expectedAttestations.length]
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAttestations(
          identifier1,
          [issuer2],
          issuer2Attestations.length
        )
        checkAgainstExpectedAttestations(
          expectedCountsPerIssuer,
          expectedAttestations,
          countsPerIssuer,
          addresses,
          issuedOns,
          signers
        )
      })
    })
  })

  describe('#lookupAllAttestations', () => {
    describe('when identifier has not been registered', () => {
      it('should return empty list', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAllAttestations(identifier1, [issuer1])
        checkAgainstExpectedAttestations([0], [], countsPerIssuer, addresses, issuedOns, signers)
      })
    })

    describe('when identifier has been registered', () => {
      const account2 = accounts[3]

      const issuer2 = accounts[4]
      const issuer2Signer = accounts[5]
      const issuer2Signer2 = accounts[6]
      const issuer3 = accounts[7]

      const issuer1Attestations: AttestationTestCase[] = [
        {
          account: account1,
          issuedOn: nowUnixTime,
          signer: signer1,
        },
        // Same issuer as [0], different account
        {
          account: account2,
          issuedOn: nowUnixTime,
          signer: signer1,
        },
      ]
      const issuer2Attestations: AttestationTestCase[] = [
        // Same account as issuer1Attestations[0], different issuer
        {
          account: account1,
          issuedOn: nowUnixTime,
          signer: issuer2Signer,
        },
        // Different account and signer
        {
          account: account2,
          issuedOn: nowUnixTime,
          signer: issuer2Signer2,
        },
      ]

      beforeEach(async () => {
        // Require consistent order for test cases
        await accountsInstance.createAccount({ from: issuer2 })
        for (const { issuer, attestationsPerIssuer } of [
          { issuer: issuer1, attestationsPerIssuer: issuer1Attestations },
          { issuer: issuer2, attestationsPerIssuer: issuer2Attestations },
        ]) {
          for (const attestation of attestationsPerIssuer) {
            await signAndRegisterAttestation(
              identifier1,
              issuer,
              attestation.account,
              attestation.issuedOn,
              attestation.signer
            )
          }
        }
      })

      describe('#getNumberOfUnrevokedAttestations', () => {
        it('should get no attestations if no issuers specified', async () => {
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedAttestations(identifier1, [])
          checkAgainstExpectedCountsPerIssuer([], totalAttestations, countsPerIssuer)
        })
        it('should get no attestations with unregistered identifier', async () => {
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedAttestations(identifier2, [issuer1])
          checkAgainstExpectedCountsPerIssuer([0], totalAttestations, countsPerIssuer)
        })
        it('should get the correct total number of attestations with one issuer', async () => {
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedAttestations(identifier1, [issuer1])
          checkAgainstExpectedCountsPerIssuer(
            [issuer1Attestations.length],
            totalAttestations,
            countsPerIssuer
          )
        })
        it('should get the correct total number of attestations with multiple issuers in the correct order', async () => {
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedAttestations(identifier1, [
            issuer3,
            issuer1,
            issuer2,
          ])
          checkAgainstExpectedCountsPerIssuer(
            [0, issuer1Attestations.length, issuer2Attestations.length],
            totalAttestations,
            countsPerIssuer
          )
        })
        it('should not get attestations from revoked signers', async () => {
          await federatedAttestations.revokeSigner(issuer2Attestations[0].signer)
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedAttestations(identifier1, [issuer2])
          checkAgainstExpectedCountsPerIssuer([1], totalAttestations, countsPerIssuer)
        })
      })

      // TODO EN delete these if this is a private helper function
      xdescribe('#getTotalNumberOfAttestations', () => {
        it('should get 0 attestations if no issuers specified', async () => {
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getTotalNumberOfAttestations(identifier1, [])
          assert.equal(totalAttestations.toNumber(), 0)
          expect(countsPerIssuer.map((count) => count.toNumber())).to.eql([])
        })
        it('should get 0 attestations with unregistered identifier', async () => {
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getTotalNumberOfAttestations(identifier2, [issuer1])
          assert.equal(totalAttestations.toNumber(), 0)
          expect(countsPerIssuer.map((count) => count.toNumber())).to.eql([0])
        })
        it('should get the correct total number of attestations with one issuer', async () => {
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getTotalNumberOfAttestations(identifier1, [issuer1])
          assert.equal(totalAttestations.toNumber(), issuer1Attestations.length)
          expect(countsPerIssuer.map((count) => count.toNumber())).to.eql([
            issuer1Attestations.length,
          ])
        })
        it('should get revoked and unrevoked attestations from multiple issuers', async () => {
          await federatedAttestations.revokeSigner(issuer2Attestations[0].signer)
          const [
            totalAttestations,
            countsPerIssuer,
          ] = await federatedAttestations.getTotalNumberOfAttestations(identifier1, [
            issuer3,
            issuer1,
            issuer2,
          ])
          assert.equal(
            totalAttestations.toNumber(),
            issuer1Attestations.length + issuer2Attestations.length
          )
          expect(countsPerIssuer.map((count) => count.toNumber())).to.eql([
            0,
            issuer1Attestations.length,
            issuer2Attestations.length,
          ])
        })
      })

      it('should return empty count and list if no issuers specified', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAllAttestations(identifier1, [])
        checkAgainstExpectedAttestations([], [], countsPerIssuer, addresses, issuedOns, signers)
      })

      it('should return all attestations from one issuer', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAllAttestations(identifier1, [issuer1])
        checkAgainstExpectedAttestations(
          [issuer1Attestations.length],
          issuer1Attestations,
          countsPerIssuer,
          addresses,
          issuedOns,
          signers
        )
      })

      it('should return empty list if no attestations exist for an issuer', async () => {
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAllAttestations(identifier1, [issuer3])
        checkAgainstExpectedAttestations([0], [], countsPerIssuer, addresses, issuedOns, signers)
      })

      it('should return attestations from multiple issuers in correct order', async () => {
        const expectedAttestations = issuer2Attestations.concat(issuer1Attestations)
        const expectedCountsPerIssuer = [0, issuer2Attestations.length, issuer1Attestations.length]
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAllAttestations(identifier1, [
          issuer3,
          issuer2,
          issuer1,
        ])
        checkAgainstExpectedAttestations(
          expectedCountsPerIssuer,
          expectedAttestations,
          countsPerIssuer,
          addresses,
          issuedOns,
          signers
        )
      })

      it('should return attestations from revoked and unrevoked signers', async () => {
        await federatedAttestations.revokeSigner(issuer1Attestations[0].signer)
        const expectedAttestations = issuer1Attestations.concat(issuer2Attestations)
        const expectedCountsPerIssuer = [issuer1Attestations.length, issuer2Attestations.length]
        const [
          countsPerIssuer,
          addresses,
          issuedOns,
          signers,
        ] = await federatedAttestations.lookupAllAttestations(identifier1, [issuer1, issuer2])
        checkAgainstExpectedAttestations(
          expectedCountsPerIssuer,
          expectedAttestations,
          countsPerIssuer,
          addresses,
          issuedOns,
          signers
        )
      })
    })
  })

  describe('#lookupIdentifiersByAddress', () => {
    interface IdentifierTestCase {
      identifier: string
      signer: string
    }

    const checkAgainstExpectedIdCases = (
      expectedCountsPerIssuer: number[],
      expectedIdentifiers: IdentifierTestCase[],
      actualCountsPerIssuer: BigNumber[],
      actualIdentifiers: string[]
    ) => {
      expect(actualCountsPerIssuer.map((count) => count.toNumber())).to.eql(expectedCountsPerIssuer)
      expect(actualIdentifiers).to.eql(expectedIdentifiers.map((idCase) => idCase.identifier))
    }

    describe('when address has not been registered', () => {
      it('should return empty list', async () => {
        const [
          actualCountsPerIssuer,
          actualIdentifiers,
        ] = await federatedAttestations.lookupIdentifiersByAddress(account1, [issuer1], 1)
        checkAgainstExpectedIdCases([0], [], actualCountsPerIssuer, actualIdentifiers)
      })
    })

    describe('when address has been registered', () => {
      const issuer2 = accounts[3]
      const issuer2Signer = accounts[4]
      const issuer2Signer2 = accounts[5]
      const issuer3 = accounts[6]

      const issuer1IdCases: IdentifierTestCase[] = [
        {
          identifier: identifier1,
          signer: signer1,
        },
        {
          identifier: identifier2,
          signer: signer1,
        },
      ]
      const issuer2IdCases: IdentifierTestCase[] = [
        {
          identifier: identifier1,
          signer: issuer2Signer2,
        },
        {
          identifier: identifier2,
          signer: issuer2Signer,
        },
      ]

      beforeEach(async () => {
        await accountsInstance.createAccount({ from: issuer2 })
        // Require consistent order for test cases
        for (const { issuer, idCasesPerIssuer } of [
          { issuer: issuer1, idCasesPerIssuer: issuer1IdCases },
          { issuer: issuer2, idCasesPerIssuer: issuer2IdCases },
        ]) {
          for (const idCase of idCasesPerIssuer) {
            await signAndRegisterAttestation(
              idCase.identifier,
              issuer,
              account1,
              nowUnixTime,
              idCase.signer
            )
          }
        }
      })

      describe.only('#getNumberOfUnrevokedIdentifiers', () => {
        it('should get no identifiers if no issuers specified', async () => {
          const [
            totalIdentifiers,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedIdentifiers(account1, [])
          checkAgainstExpectedCountsPerIssuer([], totalIdentifiers, countsPerIssuer)
        })
        it('should get no identifiers with unregistered address', async () => {
          const [
            totalIdentifiers,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedIdentifiers(accounts[7], [issuer1])
          checkAgainstExpectedCountsPerIssuer([0], totalIdentifiers, countsPerIssuer)
        })
        it('should get the correct total number of identifiers with one issuer', async () => {
          const [
            totalIdentifiers,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedIdentifiers(account1, [issuer1])
          checkAgainstExpectedCountsPerIssuer(
            [issuer1IdCases.length],
            totalIdentifiers,
            countsPerIssuer
          )
        })
        it('should get the correct total number of identifiers with multiple issuers in the correct order', async () => {
          const [
            totalIdentifiers,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedIdentifiers(account1, [
            issuer3,
            issuer1,
            issuer2,
          ])
          checkAgainstExpectedCountsPerIssuer(
            [0, issuer1IdCases.length, issuer2IdCases.length],
            totalIdentifiers,
            countsPerIssuer
          )
        })
        it('should not get identifiers from revoked signers', async () => {
          await federatedAttestations.revokeSigner(issuer2IdCases[0].signer)
          const [
            totalIdentifiers,
            countsPerIssuer,
          ] = await federatedAttestations.getNumberOfUnrevokedIdentifiers(account1, [issuer2])
          checkAgainstExpectedCountsPerIssuer([1], totalIdentifiers, countsPerIssuer)
        })
      })

      it('should return empty count if no issuers specified', async () => {
        const [
          actualCountsPerIssuer,
          actualIdentifiers,
        ] = await federatedAttestations.lookupIdentifiersByAddress(account1, [], 1)
        checkAgainstExpectedIdCases([], [], actualCountsPerIssuer, actualIdentifiers)
      })

      it('should return all identifiers from one issuer', async () => {
        const [
          actualCountsPerIssuer,
          actualIdentifiers,
        ] = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer1],
          issuer1IdCases.length + 1
        )
        checkAgainstExpectedIdCases(
          [issuer1IdCases.length],
          issuer1IdCases,
          actualCountsPerIssuer,
          actualIdentifiers
        )
      })

      it('should return empty list if no identifiers exist for an (issuer,address)', async () => {
        const [
          actualCountsPerIssuer,
          actualIdentifiers,
        ] = await federatedAttestations.lookupIdentifiersByAddress(account1, [issuer3], 1)
        checkAgainstExpectedIdCases([0], [], actualCountsPerIssuer, actualIdentifiers)
      })

      it('should return identifiers from multiple issuers in correct order', async () => {
        const expectedIdCases = issuer2IdCases.concat(issuer1IdCases)
        const expectedCountsPerIssuer = [0, issuer2IdCases.length, issuer1IdCases.length]
        const [
          actualCountsPerIssuer,
          actualIdentifiers,
        ] = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer3, issuer2, issuer1],
          expectedIdCases.length + 1
        )
        checkAgainstExpectedIdCases(
          expectedCountsPerIssuer,
          expectedIdCases,
          actualCountsPerIssuer,
          actualIdentifiers
        )
      })

      it('should return empty list if maxIdentifiers == 0', async () => {
        const [
          actualCountsPerIssuer,
          actualIdentifiers,
        ] = await federatedAttestations.lookupIdentifiersByAddress(account1, [issuer1], 0)
        checkAgainstExpectedIdCases([0], [], actualCountsPerIssuer, actualIdentifiers)
      })

      it('should only return maxIdentifiers identifiers when more are present', async () => {
        const expectedIdCases = issuer2IdCases.concat(issuer1IdCases).slice(0, -1)
        const expectedCountsPerIssuer = [
          issuer2IdCases.length,
          expectedIdCases.length - issuer2IdCases.length,
        ]
        const [
          actualCountsPerIssuer,
          actualIdentifiers,
        ] = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer2, issuer1],
          expectedIdCases.length
        )
        checkAgainstExpectedIdCases(
          expectedCountsPerIssuer,
          expectedIdCases,
          actualCountsPerIssuer,
          actualIdentifiers
        )
      })

      it('should not return identifiers from revoked signers', async () => {
        await federatedAttestations.revokeSigner(issuer2IdCases[0].signer)
        const expectedIdCases = issuer2IdCases.slice(1)
        const expectedCountsPerIssuer = [expectedIdCases.length]
        const [
          actualCountsPerIssuer,
          actualIdentifiers,
        ] = await federatedAttestations.lookupIdentifiersByAddress(
          account1,
          [issuer2],
          expectedIdCases.length + 1
        )
        checkAgainstExpectedIdCases(
          expectedCountsPerIssuer,
          expectedIdCases,
          actualCountsPerIssuer,
          actualIdentifiers
        )
      })
    })
  })

  describe('#isValidAttestation', async () => {
    describe('with an authorized AttestationSigner', async () => {
      beforeEach(async () => {
        await accountsInstance.authorizeSigner(signer1, signerRole, { from: issuer1 })
        await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer1 })
      })

      it('should return true if a valid signature is used', async () => {
        assert.isTrue(
          await federatedAttestations.isValidAttestation(
            identifier1,
            issuer1,
            account1,
            nowUnixTime,
            signer1,
            sig.v,
            sig.r,
            sig.s
          )
        )
      })

      it('should return false if an invalid signature is provided', async () => {
        const sig2 = await getSignatureForAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          accounts[3],
          chainId,
          federatedAttestations.address
        )
        assert.isFalse(
          await federatedAttestations.isValidAttestation(
            identifier1,
            issuer1,
            account1,
            nowUnixTime,
            signer1,
            sig2.v,
            sig2.r,
            sig2.s
          )
        )
      })

      const wrongArgs = [
        [0, 'identifier', identifier2],
        [1, 'issuer', accounts[3]],
        [2, 'account', accounts[3]],
        [3, 'issuedOn', nowUnixTime - 1],
        [4, 'signer', accounts[3]],
      ]
      wrongArgs.forEach(([index, arg, wrongValue]) => {
        it(`should fail if the provided ${arg} is different from the attestation`, async () => {
          const args = [identifier1, issuer1, account1, nowUnixTime, signer1, sig.v, sig.r, sig.s]
          args[index] = wrongValue

          if (arg === 'issuer' || arg === 'signer') {
            await assertRevert(federatedAttestations.isValidAttestation.apply(this, args))
          } else {
            assert.isFalse(await federatedAttestations.isValidAttestation.apply(this, args))
          }
        })
      })

      it('should revert if the signer is revoked', async () => {
        await federatedAttestations.revokeSigner(signer1)
        await assertRevertWithReason(
          federatedAttestations.isValidAttestation(
            identifier1,
            issuer1,
            account1,
            nowUnixTime,
            signer1,
            sig.v,
            sig.r,
            sig.s
          ),
          'Signer has been revoked'
        )
      })
    })

    it('should revert if the signer is not authorized as an AttestationSigner by the issuer', async () => {
      await assertRevert(
        federatedAttestations.isValidAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })

    it('should revert if the signer is authorized as a different role by the issuer', async () => {
      const role = keccak256('random')
      await accountsInstance.authorizeSigner(signer1, role, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, role, { from: signer1 })

      await assertRevert(
        federatedAttestations.isValidAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })
  })

  describe('#registerAttestation', () => {
    beforeEach(async () => {
      await accountsInstance.authorizeSigner(signer1, signerRole, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer1 })
    })

    it('should emit AttestationRegistered for a valid attestation', async () => {
      const register = await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        nowUnixTime,
        signer1,
        sig.v,
        sig.r,
        sig.s
      )
      assertLogMatches2(register.logs[0], {
        event: 'AttestationRegistered',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
          issuedOn: nowUnixTime,
          signer: signer1,
        },
      })
    })

    it('should succeed if issuer == signer', async () => {
      const issuerSig = await getSignatureForAttestation(
        identifier1,
        issuer1,
        account1,
        nowUnixTime,
        issuer1,
        chainId,
        federatedAttestations.address
      )
      const register = await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        nowUnixTime,
        issuer1,
        issuerSig.v,
        issuerSig.r,
        issuerSig.s
      )
      assertLogMatches2(register.logs[0], {
        event: 'AttestationRegistered',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
          issuedOn: nowUnixTime,
          signer: issuer1,
        },
      })
    })

    it('should revert if an invalid signature is provided', async () => {
      const sig2 = await getSignatureForAttestation(
        identifier1,
        issuer1,
        account1,
        nowUnixTime,
        accounts[3],
        chainId,
        federatedAttestations.address
      )
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          sig2.v,
          sig2.r,
          sig2.s
        )
      )
    })

    it('should revert if signer has been revoked', async () => {
      await federatedAttestations.revokeSigner(signer1)
      await assertRevertWithReason(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          sig.v,
          sig.r,
          sig.s
        ),
        'Signer has been revoked'
      )
    })

    describe('when registering a second attestation', () => {
      beforeEach(async () => {
        // register first attestation
        await federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          sig.v,
          sig.r,
          sig.s
        )
      })

      it('should revert if an attestation with the same (issuer, identifier, account) is uploaded again', async () => {
        // Upload the same attestation signed by a different signer, authorized under the same issuer
        const signer2 = accounts[4]
        await accountsInstance.authorizeSigner(signer2, signerRole, { from: issuer1 })
        await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer2 })
        const sig2 = await getSignatureForAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime + 1,
          signer2,
          1,
          federatedAttestations.address
        )
        await assertRevert(
          federatedAttestations.registerAttestation(
            identifier1,
            issuer1,
            account1,
            nowUnixTime,
            signer2,
            sig2.v,
            sig2.r,
            sig2.s
          )
        )
      })

      it('should succeed with a different identifier', async () => {
        const sig2 = await getSignatureForAttestation(
          identifier2,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          chainId,
          federatedAttestations.address
        )
        const register2 = await federatedAttestations.registerAttestation(
          identifier2,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          sig2.v,
          sig2.r,
          sig2.s
        )
        assertLogMatches2(register2.logs[0], {
          event: 'AttestationRegistered',
          args: {
            identifier: identifier2,
            issuer: issuer1,
            account: account1,
            issuedOn: nowUnixTime,
            signer: signer1,
          },
        })
      })

      it('should succeed with a different issuer', async () => {
        const issuer2 = accounts[4]
        const signer2 = accounts[5]
        await accountsInstance.createAccount({ from: issuer2 })
        await accountsInstance.authorizeSigner(signer2, signerRole, { from: issuer2 })
        await accountsInstance.completeSignerAuthorization(issuer2, signerRole, { from: signer2 })
        const sig2 = await getSignatureForAttestation(
          identifier1,
          issuer2,
          account1,
          nowUnixTime,
          signer2,
          chainId,
          federatedAttestations.address
        )
        const register2 = await federatedAttestations.registerAttestation(
          identifier1,
          issuer2,
          account1,
          nowUnixTime,
          signer2,
          sig2.v,
          sig2.r,
          sig2.s,
          { from: issuer2 }
        )
        assertLogMatches2(register2.logs[0], {
          event: 'AttestationRegistered',
          args: {
            identifier: identifier1,
            issuer: issuer2,
            account: account1,
            issuedOn: nowUnixTime,
            signer: signer2,
          },
        })
      })

      it('should succeed with a different account', async () => {
        const account2 = accounts[4]
        const sig2 = await getSignatureForAttestation(
          identifier1,
          issuer1,
          account2,
          nowUnixTime,
          signer1,
          chainId,
          federatedAttestations.address
        )
        const register2 = await federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account2,
          nowUnixTime,
          signer1,
          sig2.v,
          sig2.r,
          sig2.s,
          { from: issuer1 }
        )
        assertLogMatches2(register2.logs[0], {
          event: 'AttestationRegistered',
          args: {
            identifier: identifier1,
            issuer: issuer1,
            account: account2,
            issuedOn: nowUnixTime,
            signer: signer1,
          },
        })
      })
    })

    it('should revert if an invalid user attempts to register the attestation', async () => {
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          sig.v,
          sig.r,
          sig.s,
          { from: accounts[4] }
        )
      )
    })

    it('should succeed if a different AttestationSigner authorized by the same issuer registers the attestation', async () => {
      const signer2 = accounts[4]
      await accountsInstance.authorizeSigner(signer2, signerRole, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer2 })
      const register = await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        nowUnixTime,
        signer1,
        sig.v,
        sig.r,
        sig.s,
        { from: signer2 }
      )
      assertLogMatches2(register.logs[0], {
        event: 'AttestationRegistered',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
          issuedOn: nowUnixTime,
          signer: signer1,
        },
      })
    })
  })

  describe('#deleteAttestation', () => {
    // TODO ASv2 check that the actual entries were deleted in both mappings
    // (for identifiers and attestations)
    beforeEach(async () => {
      await accountsInstance.authorizeSigner(signer1, signerRole, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer1 })
      await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        nowUnixTime,
        signer1,
        sig.v,
        sig.r,
        sig.s
      )
    })

    it('should emit an AttestationDeleted event after successfully deleting', async () => {
      const deleteAttestation = await federatedAttestations.deleteAttestation(
        identifier1,
        issuer1,
        account1
      )
      assertLogMatches2(deleteAttestation.logs[0], {
        event: 'AttestationDeleted',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
        },
      })
    })

    it('should succeed when >1 attestations are registered for (identifier, issuer)', async () => {
      const account2 = accounts[3]
      await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer1)
      const deleteAttestation = await federatedAttestations.deleteAttestation(
        identifier1,
        issuer1,
        account2,
        {
          from: account2,
        }
      )
      assertLogMatches2(deleteAttestation.logs[0], {
        event: 'AttestationDeleted',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account2,
        },
      })
    })

    it('should succeed when >1 identifiers are registered for (account, issuer)', async () => {
      await signAndRegisterAttestation(identifier2, issuer1, account1, nowUnixTime, signer1)
      const deleteAttestation = await federatedAttestations.deleteAttestation(
        identifier2,
        issuer1,
        account1,
        {
          from: account1,
        }
      )
      assertLogMatches2(deleteAttestation.logs[0], {
        event: 'AttestationDeleted',
        args: {
          identifier: identifier2,
          issuer: issuer1,
          account: account1,
        },
      })
    })

    it('should revert if an invalid user attempts to delete the attestation', async () => {
      await assertRevert(
        federatedAttestations.deleteAttestation(identifier1, issuer1, account1, {
          from: accounts[4],
        })
      )
    })

    it('should revert if a revoked signer attempts to delete the attestation', async () => {
      await federatedAttestations.revokeSigner(signer1)
      await assertRevert(
        federatedAttestations.deleteAttestation(identifier1, issuer1, account1, { from: signer1 })
      )
    })

    it('should successfully delete an attestation with a revoked signer', async () => {
      await federatedAttestations.revokeSigner(signer1)
      const deleteAttestation = await federatedAttestations.deleteAttestation(
        identifier1,
        issuer1,
        account1
      )
      assertLogMatches2(deleteAttestation.logs[0], {
        event: 'AttestationDeleted',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
        },
      })
    })

    it('should fail registering same attestation but succeed after deleting it', async () => {
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          signer1,
          sig.v,
          sig.r,
          sig.s
        )
      )
      await federatedAttestations.deleteAttestation(identifier1, issuer1, account1)
      const register = await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        nowUnixTime,
        signer1,
        sig.v,
        sig.r,
        sig.s
      )
      assertLogMatches2(register.logs[0], {
        event: 'AttestationRegistered',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
          issuedOn: nowUnixTime,
          signer: signer1,
        },
      })
    })
  })
})
