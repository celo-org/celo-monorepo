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
  assertThrowsAsync,
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
import { encodePacked, keccak256 } from 'web3-utils'

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

  const signerRole = keccak256(encodePacked('celo.org/core/attestation'))
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
      signer,
      issuedOn,
      attestationSignature.v,
      attestationSignature.r,
      attestationSignature.s,
      {
        from: issuer,
      }
    )
  }

  const assertAttestationInStorage = async (
    identifier: string,
    issuer: string,
    attestationIndex: number,
    account: string,
    issuedOn: number,
    signer: string,
    identifierIndex: number
  ) => {
    const attestation = await federatedAttestations.identifierToAttestations(
      identifier,
      issuer,
      attestationIndex
    )
    assert.equal(attestation['account'], account)
    assert.equal(attestation['issuedOn'], issuedOn)
    assert.equal(attestation['signer'], signer)
    const storedIdentifier = await federatedAttestations.addressToIdentifiers(
      account,
      issuer,
      identifierIndex
    )
    assert.equal(identifier, storedIdentifier)
  }

  const assertAttestationNotInStorage = async (
    identifier: string,
    issuer: string,
    account: string,
    addressIndex: number,
    identifierIndex: number
  ) => {
    await assertThrowsAsync(
      federatedAttestations.identifierToAttestations(identifier, issuer, addressIndex)
    )
    await assertThrowsAsync(
      federatedAttestations.addressToIdentifiers(account, issuer, identifierIndex)
    )
  }

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

  beforeEach('FederatedAttestations setup', async () => {
    accountsInstance = await Accounts.new(true)
    federatedAttestations = await FederatedAttestations.new(true)
    registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(
      CeloContractName.FederatedAttestations,
      federatedAttestations.address
    )
    await accountsInstance.initialize(registry.address)
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
        'OwnershipAttestation(bytes32 identifier,address issuer,address account,uint64 issuedOn)'
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

  describe('looking up attestations', () => {
    describe('when identifier has not been registered', () => {
      describe('#lookupAttestations', () => {
        it('should return empty list', async () => {
          const [
            countsPerIssuer,
            addresses,
            issuedOns,
            signers,
          ] = await federatedAttestations.lookupAttestations(identifier1, [issuer1])
          checkAgainstExpectedAttestations([0], [], countsPerIssuer, addresses, issuedOns, signers)
        })
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

      describe('#lookupAttestations', () => {
        it('should return empty count and list if no issuers specified', async () => {
          const [
            countsPerIssuer,
            addresses,
            issuedOns,
            signers,
          ] = await federatedAttestations.lookupAttestations(identifier1, [])
          checkAgainstExpectedAttestations([], [], countsPerIssuer, addresses, issuedOns, signers)
        })

        it('should return all attestations from one issuer', async () => {
          const [
            countsPerIssuer,
            addresses,
            issuedOns,
            signers,
          ] = await federatedAttestations.lookupAttestations(identifier1, [issuer1])
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
          ] = await federatedAttestations.lookupAttestations(identifier1, [issuer3])
          checkAgainstExpectedAttestations([0], [], countsPerIssuer, addresses, issuedOns, signers)
        })

        it('should return attestations from multiple issuers in correct order', async () => {
          const expectedAttestations = issuer2Attestations.concat(issuer1Attestations)
          const expectedCountsPerIssuer = [
            0,
            issuer2Attestations.length,
            issuer1Attestations.length,
          ]
          const [
            countsPerIssuer,
            addresses,
            issuedOns,
            signers,
          ] = await federatedAttestations.lookupAttestations(identifier1, [
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
      })
    })
  })

  describe('looking up identifiers', () => {
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
      describe('#lookupIdentifiers', () => {
        it('should return empty list', async () => {
          const [
            actualCountsPerIssuer,
            actualIdentifiers,
          ] = await federatedAttestations.lookupIdentifiers(account1, [issuer1])
          checkAgainstExpectedIdCases([0], [], actualCountsPerIssuer, actualIdentifiers)
        })
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

      describe('#lookupIdentifiers', () => {
        it('should return empty count if no issuers specified', async () => {
          const [
            actualCountsPerIssuer,
            actualIdentifiers,
          ] = await federatedAttestations.lookupIdentifiers(account1, [])
          checkAgainstExpectedIdCases([], [], actualCountsPerIssuer, actualIdentifiers)
        })

        it('should return all identifiers from one issuer', async () => {
          const [
            actualCountsPerIssuer,
            actualIdentifiers,
          ] = await federatedAttestations.lookupIdentifiers(account1, [issuer1])
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
          ] = await federatedAttestations.lookupIdentifiers(account1, [issuer3])
          checkAgainstExpectedIdCases([0], [], actualCountsPerIssuer, actualIdentifiers)
        })

        it('should return identifiers from multiple issuers in correct order', async () => {
          const expectedIdCases = issuer2IdCases.concat(issuer1IdCases)
          const expectedCountsPerIssuer = [0, issuer2IdCases.length, issuer1IdCases.length]
          const [
            actualCountsPerIssuer,
            actualIdentifiers,
          ] = await federatedAttestations.lookupIdentifiers(account1, [issuer3, issuer2, issuer1])
          checkAgainstExpectedIdCases(
            expectedCountsPerIssuer,
            expectedIdCases,
            actualCountsPerIssuer,
            actualIdentifiers
          )
        })
      })
    })
  })

  describe('#validateAttestation', async () => {
    describe('with an authorized AttestationSigner', async () => {
      beforeEach(async () => {
        await accountsInstance.authorizeSigner(signer1, signerRole, { from: issuer1 })
        await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer1 })
      })

      it('should return successfully if a valid signature is used', async () => {
        assert.isOk(
          await federatedAttestations.validateAttestationSig(
            identifier1,
            issuer1,
            account1,
            signer1,
            nowUnixTime,
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
        await assertRevert(
          federatedAttestations.validateAttestationSig(
            identifier1,
            issuer1,
            account1,
            signer1,
            nowUnixTime,
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
        [3, 'signer', accounts[3]],
        [4, 'issuedOn', nowUnixTime - 1],
      ]
      wrongArgs.forEach(([index, arg, wrongValue]) => {
        it(`should fail if the provided ${arg} is different from the attestation`, async () => {
          const args = [identifier1, issuer1, account1, signer1, nowUnixTime, sig.v, sig.r, sig.s]
          args[index] = wrongValue
          await assertRevert(federatedAttestations.validateAttestationSig.apply(this, args))
        })
      })
    })

    it('should revert if the signer is not authorized as an AttestationSigner by the issuer', async () => {
      await assertRevert(
        federatedAttestations.validateAttestationSig(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
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
        federatedAttestations.validateAttestationSig(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
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
        signer1,
        nowUnixTime,
        sig.v,
        sig.r,
        sig.s
      )

      // fetching onchain publishedOn value as expected test value to avoid testing for a specific value
      // as it would be a very flaky test
      const attestation = await federatedAttestations.identifierToAttestations(
        identifier1,
        issuer1,
        0
      )
      const publishedOn = attestation['publishedOn']
      assertLogMatches2(register.logs[0], {
        event: 'AttestationRegistered',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
          signer: signer1,
          issuedOn: nowUnixTime,
          publishedOn,
        },
      })
      assert.isAtLeast(publishedOn.toNumber(), nowUnixTime)
    })

    it('should revert if the attestation is revoked', async () => {
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1)
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })

    it('should succeed if issuer == signer', async () => {
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, issuer1)
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, issuer1, 0)
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
          signer1,
          nowUnixTime,
          sig2.v,
          sig2.r,
          sig2.s
        )
      )
    })

    it('should revert if attestation has been revoked', async () => {
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1)
      await assertRevertWithReason(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s
        ),
        'Attestation has been revoked'
      )
    })

    it('should modify identifierToAttestations and addresstoIdentifiers accordingly', async () => {
      await assertAttestationNotInStorage(identifier1, issuer1, account1, 0, 0)
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
    })

    describe('when registering a second attestation', () => {
      beforeEach(async () => {
        // register first attestation
        await federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s
        )
      })

      it('should modify identifierToAttestations and addresstoIdentifiers accordingly', async () => {
        const account2 = accounts[3]
        await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
        await assertAttestationNotInStorage(identifier1, issuer1, account2, 1, 0)

        await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer1)
        await assertAttestationInStorage(identifier1, issuer1, 1, account2, nowUnixTime, signer1, 0)
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
            signer2,
            nowUnixTime,
            sig2.v,
            sig2.r,
            sig2.s
          )
        )
      })

      it('should succeed with a different identifier', async () => {
        await signAndRegisterAttestation(identifier2, issuer1, account1, nowUnixTime, signer1)
        await assertAttestationInStorage(identifier2, issuer1, 0, account1, nowUnixTime, signer1, 1)
      })

      it('should succeed with a different issuer', async () => {
        const issuer2 = accounts[4]
        const signer2 = accounts[5]
        await accountsInstance.createAccount({ from: issuer2 })
        await signAndRegisterAttestation(identifier1, issuer2, account1, nowUnixTime, signer2)
        await assertAttestationInStorage(identifier1, issuer2, 0, account1, nowUnixTime, signer2, 0)
      })

      it('should succeed with a different account', async () => {
        const account2 = accounts[4]
        await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer1)
        await assertAttestationInStorage(identifier1, issuer1, 1, account2, nowUnixTime, signer1, 0)
      })
    })

    it('should succeed if any user attempts to register the attestation with a valid signature', async () => {
      assert.isOk(
        await federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
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
      await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        signer1,
        nowUnixTime,
        sig.v,
        sig.r,
        sig.s,
        { from: signer2 }
      )
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
    })

    it('should succeed if the issuer submits the attestation directly', async () => {
      assert.isOk(
        await federatedAttestations.registerAttestationAsIssuer(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          { from: issuer1 }
        )
      )
    })

    it('should succeed if issuer is not registered in Accounts.sol', async () => {
      const issuer2 = accounts[3]
      assert.isFalse(await accountsInstance.isAccount(issuer2))
      assert.isOk(
        await federatedAttestations.registerAttestationAsIssuer(
          identifier1,
          issuer2,
          account1,
          nowUnixTime,
          { from: issuer2 }
        )
      )
    })

    it('should revert if a non-issuer submits an attestation with no signature', async () => {
      await assertRevert(
        federatedAttestations.registerAttestationAsIssuer(
          identifier1,
          issuer1,
          account1,
          nowUnixTime,
          { from: signer1 }
        )
      )
    })
  })

  describe('#revokeAttestation', () => {
    beforeEach(async () => {
      await accountsInstance.authorizeSigner(signer1, signerRole, { from: issuer1 })
      await accountsInstance.completeSignerAuthorization(issuer1, signerRole, { from: signer1 })
      await federatedAttestations.registerAttestation(
        identifier1,
        issuer1,
        account1,
        signer1,
        nowUnixTime,
        sig.v,
        sig.r,
        sig.s
      )
    })

    it('should modify identifierToAddresses and addresstoIdentifiers accordingly', async () => {
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1)
      await assertAttestationNotInStorage(identifier1, issuer1, account1, 0, 0)
    })

    it('should succeed when revoked by a current signer of issuer', async () => {
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
        from: signer1,
      })
      await assertAttestationNotInStorage(identifier1, issuer1, account1, 0, 0)
    })

    it('should revert when signer has been deregistered', async () => {
      await accountsInstance.removeSigner(signer1, signerRole, { from: issuer1 })
      await assertRevert(
        federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
          from: signer1,
        })
      )
      // TODO EN: go to this one ideally
      // await assertRevertWithReason(
      //   federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
      //     from: signer1,
      //   }),
      //   'Sender does not have permission to revoke this attestation'
      // )
    })

    it('should emit an AttestationRevoked event after successfully revoking', async () => {
      const attestation = await federatedAttestations.identifierToAttestations(
        identifier1,
        issuer1,
        0
      )

      // fetching onchain publishedOn value as expected test value to avoid testing for a specific value
      // as it would be a very flaky test to try and predict the value
      const publishedOn = attestation['publishedOn']
      const revokeAttestation = await federatedAttestations.revokeAttestation(
        identifier1,
        issuer1,
        account1
      )
      assertLogMatches2(revokeAttestation.logs[0], {
        event: 'AttestationRevoked',
        args: {
          identifier: identifier1,
          issuer: issuer1,
          account: account1,
          signer: signer1,
          issuedOn: nowUnixTime,
          publishedOn,
        },
      })
    })

    it('should succeed if issuer is not registered in Accounts.sol', async () => {
      const issuer2 = accounts[3]
      assert.isFalse(await accountsInstance.isAccount(issuer2))
      await federatedAttestations.registerAttestationAsIssuer(
        identifier1,
        issuer2,
        account1,
        nowUnixTime,
        { from: issuer2 }
      )
      await assertAttestationInStorage(identifier1, issuer2, 0, account1, nowUnixTime, issuer2, 0)
      await federatedAttestations.revokeAttestation(identifier1, issuer2, account1, {
        from: issuer2,
      })
      await assertAttestationNotInStorage(identifier1, issuer2, account1, 0, 0)
    })

    it("should revert when revoking an attestation that doesn't exist", async () => {
      await assertRevertWithReason(
        federatedAttestations.revokeAttestation(identifier1, issuer1, accounts[4]),
        'Attestion to be revoked does not exist'
      )
    })

    it('should succeed when >1 attestations are registered for (identifier, issuer)', async () => {
      const account2 = accounts[3]
      await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer1)
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account2, {
        from: account2,
      })
      await assertAttestationNotInStorage(identifier1, issuer1, account2, 1, 0)
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
    })

    it('should succeed when >1 identifiers are registered for (account, issuer)', async () => {
      await signAndRegisterAttestation(identifier2, issuer1, account1, nowUnixTime, signer1)
      await federatedAttestations.revokeAttestation(identifier2, issuer1, account1, {
        from: account1,
      })
      await assertAttestationNotInStorage(identifier2, issuer1, account1, 0, 1)
      await assertAttestationInStorage(identifier1, issuer1, 0, account1, nowUnixTime, signer1, 0)
    })

    const newAttestation = [
      [0, 'identifier', identifier2],
      // skipping issuer as it requires a different signer as well
      [2, 'account', accounts[3]],
      [3, 'issuedOn', nowUnixTime + 1],
      [4, 'signer', accounts[3]],
    ]
    newAttestation.forEach(([index, arg, newVal]) => {
      it(`after revoking an attestation, should succeed in registering new attestation with different ${arg}`, async () => {
        await federatedAttestations.revokeAttestation(identifier1, issuer1, account1)
        const args = [identifier1, issuer1, account1, nowUnixTime, signer1]
        args[index] = newVal
        await signAndRegisterAttestation.apply(this, args)
      })
    })

    it('should revert if an invalid user attempts to revoke the attestation', async () => {
      await assertRevert(
        federatedAttestations.revokeAttestation(identifier1, issuer1, account1, {
          from: accounts[4],
        })
      )
    })

    it('should fail to register a revoked attestation', async () => {
      await federatedAttestations.revokeAttestation(identifier1, issuer1, account1)
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier1,
          issuer1,
          account1,
          signer1,
          nowUnixTime,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })
  })

  describe('#batchRevokeAttestations', () => {
    const account2 = accounts[3]
    const signer2 = accounts[4]

    beforeEach(async () => {
      await signAndRegisterAttestation(identifier1, issuer1, account1, nowUnixTime, signer1)
      await signAndRegisterAttestation(identifier1, issuer1, account2, nowUnixTime, signer2)
      await signAndRegisterAttestation(identifier2, issuer1, account2, nowUnixTime, signer1)
    })
    it('should succeed if issuer batch revokes attestations', async () => {
      await federatedAttestations.batchRevokeAttestations(
        issuer1,
        [identifier1, identifier2],
        [account1, account2]
      )
      const [
        countsPerIssuer1,
        addresses1,
        issuedOns1,
        signers1,
      ] = await federatedAttestations.lookupAttestations(identifier1, [issuer1])
      checkAgainstExpectedAttestations(
        [1],
        [{ account: account2, issuedOn: nowUnixTime, signer: signer2 }],
        countsPerIssuer1,
        addresses1,
        issuedOns1,
        signers1
      )
      const [
        countsPerIssuer2,
        addresses2,
        issuedOns2,
        signers2,
      ] = await federatedAttestations.lookupAttestations(identifier2, [issuer1])
      checkAgainstExpectedAttestations([0], [], countsPerIssuer2, addresses2, issuedOns2, signers2)
    })
    it('should succeed regardless of order of (attestations, identifiers)', async () => {
      await federatedAttestations.batchRevokeAttestations(
        issuer1,
        [identifier2, identifier1],
        [account2, account1]
      )
      const [
        countsPerIssuer1,
        addresses1,
        issuedOns1,
        signers1,
      ] = await federatedAttestations.lookupAttestations(identifier1, [issuer1])
      checkAgainstExpectedAttestations(
        [1],
        [{ account: account2, issuedOn: nowUnixTime, signer: signer2 }],
        countsPerIssuer1,
        addresses1,
        issuedOns1,
        signers1
      )
      const [
        countsPerIssuer2,
        addresses2,
        issuedOns2,
        signers2,
      ] = await federatedAttestations.lookupAttestations(identifier2, [issuer1])
      checkAgainstExpectedAttestations([0], [], countsPerIssuer2, addresses2, issuedOns2, signers2)
    })

    it('should succeed if currently registered signer of issuer batch revokes attestations', async () => {
      await federatedAttestations.batchRevokeAttestations(
        issuer1,
        [identifier2, identifier1],
        [account2, account1],
        { from: signer1 }
      )
      const [
        countsPerIssuer1,
        addresses1,
        issuedOns1,
        signers1,
      ] = await federatedAttestations.lookupAttestations(identifier1, [issuer1])
      checkAgainstExpectedAttestations(
        [1],
        [{ account: account2, issuedOn: nowUnixTime, signer: signer2 }],
        countsPerIssuer1,
        addresses1,
        issuedOns1,
        signers1
      )
      const [
        countsPerIssuer2,
        addresses2,
        issuedOns2,
        signers2,
      ] = await federatedAttestations.lookupAttestations(identifier2, [issuer1])
      checkAgainstExpectedAttestations([0], [], countsPerIssuer2, addresses2, issuedOns2, signers2)
    })

    it('should succeed if issuer is not registered in Accounts.sol', async () => {
      const issuer2 = accounts[5]
      assert.isFalse(await accountsInstance.isAccount(issuer2))
      await federatedAttestations.registerAttestationAsIssuer(
        identifier1,
        issuer2,
        account1,
        nowUnixTime,
        { from: issuer2 }
      )
      await assertAttestationInStorage(identifier1, issuer2, 0, account1, nowUnixTime, issuer2, 0)
      await federatedAttestations.batchRevokeAttestations(issuer2, [identifier1], [account1], {
        from: issuer2,
      })
      await assertAttestationNotInStorage(identifier1, issuer2, account1, 0, 0)
    })

    it('should revert if deregistered signer of issuer batch revokes attestations', async () => {
      await accountsInstance.removeSigner(signer1, signerRole, { from: issuer1 })
      await assertRevert(
        federatedAttestations.batchRevokeAttestations(
          issuer1,
          [identifier2, identifier1],
          [account2, account1],
          { from: signer1 }
        )
      )
      // TODO EN add reason
    })
    it('should revert if identifiers.length != accounts.length', async () => {
      await assertRevert(
        federatedAttestations.batchRevokeAttestations(
          issuer1,
          [identifier2],
          [account2, account1],
          { from: signer1 }
        )
      )
    })
    it('should revert if one of the (identifier, account) pairs is invalid', async () => {
      await assertRevertWithReason(
        federatedAttestations.batchRevokeAttestations(
          issuer1,
          // (identifier2, account1) does not exist
          [identifier2, identifier2],
          [account2, account1],
          { from: signer1 }
        ),
        'Attestion to be revoked does not exist'
      )
    })
  })

  xdescribe('#batchRevokeAttestations benchmarking', () => {
    // benchmarking
    // interface BenchmarkAttestationCase {
    //   identifier: string
    //   account: string
    // }

    // Variant 1 == register (1 account, identifier) up to maxN
    const registerAttestationsVariant1 = async (maxN: number, issuer: string) => {
      const benchmarkIdentifiers: string[] = []
      const benchmarkAccounts: string[] = []

      for (let i = 0; i < maxN; i++) {
        // TODO may need to write a batchRegister function for testing...

        const pnIdentifier = getPhoneHash(phoneNumber, `salt${i}`)
        const newAccount = await web3.eth.accounts.create().address
        await federatedAttestations.registerAttestationAsIssuer(
          pnIdentifier,
          issuer,
          newAccount,
          nowUnixTime,
          { from: issuer }
        )
        benchmarkIdentifiers.push(pnIdentifier)
        benchmarkAccounts.push(newAccount)
      }
      return [benchmarkIdentifiers, benchmarkAccounts]
    }

    const shuffleArray = (arr: Array<any>) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    }

    // Variant 2 == register (1 account, identifier) with multiple issuers (random order registered)
    const registerAttestationsVariant2 = async (maxN: number, issuersToRandomize: string[]) => {
      const benchmarkIdentifiers: string[] = []
      const benchmarkAccounts: string[] = []

      for (let i = 0; i < maxN; i++) {
        // Randomize issuerToRevoke order
        issuersToRandomize = shuffleArray(issuersToRandomize)

        // TODO may need to write a batchRegister function for testing...
        const pnIdentifier = getPhoneHash(phoneNumber, `salt${i}`)
        const newAccount = await web3.eth.accounts.create().address
        for (let randomIssuer of issuersToRandomize) {
          await federatedAttestations.registerAttestationAsIssuer(
            pnIdentifier,
            randomIssuer,
            newAccount,
            nowUnixTime,
            { from: randomIssuer }
          )
        }
        // Add once (i.e. revoke only for `issuerToRevoke`)
        benchmarkIdentifiers.push(pnIdentifier)
        benchmarkAccounts.push(newAccount)
      }
      return [benchmarkIdentifiers, benchmarkAccounts]
    }

    // Variant 3 == register (1 account, a bunch of identifiers) with one issuer
    const registerAttestationsVariant3 = async (
      numAccounts: number,
      issuer: string,
      identifiersPerAccount: number
    ) => {
      const benchmarkIdentifiers: string[] = []
      const benchmarkAccounts: string[] = []

      for (let i = 0; i < numAccounts; i++) {
        const newAccount = await web3.eth.accounts.create().address
        for (let j = 0; j < identifiersPerAccount; j++) {
          const pnIdentifier = getPhoneHash(phoneNumber, `salt${i}${j}`)
          await federatedAttestations.registerAttestationAsIssuer(
            pnIdentifier,
            issuer,
            newAccount,
            nowUnixTime,
            { from: issuer }
          )
          benchmarkIdentifiers.push(pnIdentifier)
          benchmarkAccounts.push(newAccount)
        }
      }
      return [benchmarkIdentifiers, benchmarkAccounts]
    }

    describe('unique account <-> identifier, one issuer', () => {
      let batchIssuer1 = accounts[1]

      beforeEach(async () => {
        await accountsInstance.createAccount({ from: batchIssuer1 })
      })
      it('how much gas does it take to revoke 10 attestations?', async () => {
        // Gas: 379038
        const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant1(
          10,
          batchIssuer1
        )
        const tx = await federatedAttestations.batchRevokeAttestations(
          batchIssuer1,
          benchmarkIdentifiers,
          benchmarkAccounts,
          { from: batchIssuer1 }
        )
        console.log(tx.receipt.gasUsed)
      })
      it('how much gas does it take to revoke 100 attestations?', async () => {
        // Gas: 3691143, 3691102, 3691114
        const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant1(
          100,
          batchIssuer1
        )
        const tx = await federatedAttestations.batchRevokeAttestations(
          batchIssuer1,
          benchmarkIdentifiers,
          benchmarkAccounts,
          { from: batchIssuer1 }
        )
        console.log(tx.receipt.gasUsed)
      })
      // it('[optimized] how much gas does it take to revoke 100 attestations?', async () => {
      //   // Gas: 3690089, 3690047
      //   const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant1(
      //     100,
      //     batchIssuer1
      //   )
      //   const tx = await federatedAttestations.batchRevokeAttestations2(
      //     batchIssuer1,
      //     benchmarkIdentifiers,
      //     benchmarkAccounts,
      //     { from: batchIssuer1 }
      //   )
      //   console.log(tx.receipt.gasUsed)
      // })
      xit('how much gas does it take to revoke 1000 attestations?', async () => {
        // Hits out of gas error
        const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant1(
          1000,
          batchIssuer1
        )
        const tx = await federatedAttestations.batchRevokeAttestations(
          batchIssuer1,
          benchmarkIdentifiers,
          benchmarkAccounts,
          { from: batchIssuer1 }
        )
        console.log(tx.receipt.gasUsed)
      })
      it('how many attestations can we revoke until we hit 5 million gas?', async () => {
        // Takes 4980778 gas with 135
        // 4980766
        // 4980754
        const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant1(
          135,
          batchIssuer1
        )
        const tx = await federatedAttestations.batchRevokeAttestations(
          batchIssuer1,
          benchmarkIdentifiers,
          benchmarkAccounts,
          { from: batchIssuer1 }
        )
        console.log(tx.receipt.gasUsed)
      })
    })
    describe('1 account per identifier; 3 issuers per (account, identifier) in random order', () => {
      const batchIssuer1 = accounts[1]
      const batchIssuer2 = accounts[2]
      const batchIssuer3 = accounts[3]

      beforeEach(async () => {
        // Setup
        await accountsInstance.createAccount({ from: batchIssuer1 })
        await accountsInstance.createAccount({ from: batchIssuer2 })
        await accountsInstance.createAccount({ from: batchIssuer3 })
      })
      it('how much gas does it take to revoke 10 attestations?', async () => {
        // Gas: 379044, 379038, 379038
        const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant2(10, [
          batchIssuer1,
          batchIssuer2,
          batchIssuer3,
        ])
        const tx = await federatedAttestations.batchRevokeAttestations(
          batchIssuer1,
          benchmarkIdentifiers,
          benchmarkAccounts,
          { from: batchIssuer1 }
        )
        console.log(tx.receipt.gasUsed)
      })
      it('how much gas does it take to revoke 100 attestations?', async () => {
        // Gas: 3691137, 3691137, 3691125, 3691138
        const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant2(100, [
          batchIssuer1,
          batchIssuer2,
          batchIssuer3,
        ])
        const tx = await federatedAttestations.batchRevokeAttestations(
          batchIssuer1,
          benchmarkIdentifiers,
          benchmarkAccounts,
          { from: batchIssuer1 }
        )
        console.log(tx.receipt.gasUsed)
      })
      // it('[optimized] how much gas does it take to revoke 100 attestations?', async () => {
      //   // Gas: 3690071
      //   const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant2(
      //     100,
      //     [batchIssuer1, batchIssuer2, batchIssuer3],
      //   )
      //   const tx = await federatedAttestations.batchRevokeAttestations2(
      //     batchIssuer1,
      //     benchmarkIdentifiers,
      //     benchmarkAccounts,
      //     { from: batchIssuer1 }
      //   )
      //   console.log(tx.receipt.gasUsed)
      // })
      it('how many attestations can we revoke until we hit 5 million gas?', async () => {
        // Gas: 4980802, 4980790
        const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant2(148, [
          batchIssuer1,
          batchIssuer2,
          batchIssuer3,
        ])
        const tx = await federatedAttestations.batchRevokeAttestations(
          batchIssuer1,
          benchmarkIdentifiers,
          benchmarkAccounts,
          { from: batchIssuer1 }
        )
        console.log(tx.receipt.gasUsed)
      })
      // it('[optimized] how many attestations can we revoke until we hit 5 million gas?', async () => {
      //   // Gas:
      //   const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant2(
      //     158,
      //     [batchIssuer1, batchIssuer2, batchIssuer3],
      //   )
      //   const tx = await federatedAttestations.batchRevokeAttestations2(
      //     batchIssuer1,
      //     benchmarkIdentifiers,
      //     benchmarkAccounts,
      //     { from: batchIssuer1 }
      //   )
      //   console.log(tx.receipt.gasUsed)
      // })
    })
    describe('10 accounts, a bunch of identifiers per account', () => {
      const batchIssuer1 = accounts[1]

      beforeEach(async () => {
        // Setup
        await accountsInstance.createAccount({ from: batchIssuer1 })
      })

      it('how much gas does it take to revoke 100 attestations?', async () => {
        // Gas:
        const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant3(
          10,
          batchIssuer1,
          10
        )
        const tx = await federatedAttestations.batchRevokeAttestations(
          batchIssuer1,
          benchmarkIdentifiers,
          benchmarkAccounts,
          { from: batchIssuer1 }
        )
        console.log(tx.receipt.gasUsed)
      })

      // it('[optimized] how much gas does it take to revoke 100 attestations?', async () => {
      //   // Gas:
      //   const [benchmarkIdentifiers, benchmarkAccounts] = await registerAttestationsVariant3(
      //     10,
      //     batchIssuer1,
      //     10
      //   )
      //   const tx = await federatedAttestations.batchRevokeAttestations2(
      //     batchIssuer1,
      //     benchmarkIdentifiers,
      //     benchmarkAccounts,
      //     { from: batchIssuer1 }
      //   )
      //   console.log(tx.receipt.gasUsed)
      // })
    })
    // TODO: optimized version of batchRevoke?
  })
})
