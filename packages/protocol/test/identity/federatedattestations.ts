import {
  getDomainDigest,
  getSignatureForAttestation,
} from '@celo/protocol/lib/fed-attestations-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
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

  const issuer = accounts[0]
  const signer = accounts[1]
  const account = accounts[2]

  const phoneNumber: string = '+18005551212'
  const identifier = getPhoneHash(phoneNumber)
  const identifier2 = getPhoneHash(phoneNumber, 'dummySalt')

  const issuedOn = Math.floor(Date.now() / 1000)

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

    await accountsInstance.createAccount({ from: issuer })
    sig = await getSignatureForAttestation(
      identifier,
      issuer,
      account,
      issuedOn,
      signer,
      chainId,
      federatedAttestations.address
    )
  })

  describe('#EIP712_VALIDATE_ATTESTATION_TYPEHASH()', () => {
    it('should have set the right typehash', async () => {
      const expectedTypehash = keccak256(
        'IdentifierOwnershipAttestation(bytes32 identifier,address issuer,address account,uint256 issuedOn)'
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
      assert.equal(owner, issuer)
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
          identifier,
          [issuer],
          1
        )
        checkAgainstExpectedAttestations([], addresses, issuedOns, signers)
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
          account,
          issuedOn,
          signer,
        },
        // Same issuer as [0], different account
        {
          account: account2,
          issuedOn,
          signer,
        },
      ]
      const issuer2Attestations: AttestationTestCase[] = [
        // Same account as issuer1Attestations[0], different issuer
        {
          account,
          issuedOn,
          signer: issuer2Signer,
        },
        // Different account and signer
        {
          account: account2,
          issuedOn,
          signer: issuer2Signer2,
        },
      ]

      beforeEach(async () => {
        // Require consistent order for test cases
        await accountsInstance.createAccount({ from: issuer2 })
        for (const { issuerN, attestationsPerIssuer } of [
          { issuerN: issuer, attestationsPerIssuer: issuer1Attestations },
          { issuerN: issuer2, attestationsPerIssuer: issuer2Attestations },
        ]) {
          for (const attestation of attestationsPerIssuer) {
            await signAndRegisterAttestation(
              identifier,
              issuerN,
              attestation.account,
              attestation.issuedOn,
              attestation.signer
            )
          }
        }
      })

      it('should return all attestations from one issuer', async () => {
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          identifier,
          [issuer],
          // Do not allow for maxAttestations to coincidentally limit incorrect output
          issuer1Attestations.length + 1
        )
        checkAgainstExpectedAttestations(issuer1Attestations, addresses, issuedOns, signers)
      })

      it('should return empty list if no attestations exist for an issuer', async () => {
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          identifier,
          [issuer3],
          1
        )
        checkAgainstExpectedAttestations([], addresses, issuedOns, signers)
      })

      it('should return attestations from multiple issuers in correct order', async () => {
        const expectedAttestations = issuer2Attestations.concat(issuer1Attestations)
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          identifier,
          [issuer3, issuer2, issuer],
          expectedAttestations.length + 1
        )
        checkAgainstExpectedAttestations(expectedAttestations, addresses, issuedOns, signers)
      })

      it('should return empty list if maxAttestations == 0', async () => {
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          identifier,
          [issuer],
          0
        )
        checkAgainstExpectedAttestations([], addresses, issuedOns, signers)
      })

      it('should only return maxAttestations attestations when more are present', async () => {
        const expectedAttestations = issuer1Attestations.slice(0, -1)
        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          identifier,
          [issuer],
          expectedAttestations.length
        )
        checkAgainstExpectedAttestations(expectedAttestations, addresses, issuedOns, signers)
      })

      it('should not return attestations from revoked signers', async () => {
        const attestationToRevoke = issuer2Attestations[0]
        await federatedAttestations.revokeSigner(attestationToRevoke.signer)
        const expectedAttestations = issuer2Attestations.slice(1)

        const [addresses, issuedOns, signers] = await federatedAttestations.lookupAttestations(
          identifier,
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
          account,
          [issuer],
          1
        )
        assert.equal(actualIdentifiers.length, 0)
      })
    })

    describe('when address has been registered', () => {
      interface IdentifierTestCase {
        identifier: string
        signer: string
      }

      const checkAgainstExpectedIdCases = (
        expectedIdentifiers: IdentifierTestCase[],
        actualIdentifiers: string[]
      ) => {
        expect(expectedIdentifiers.map((idCase) => idCase.identifier)).to.eql(actualIdentifiers)
      }

      const issuer2 = accounts[3]
      const issuer2Signer = accounts[4]
      const issuer2Signer2 = accounts[5]
      const issuer3 = accounts[6]

      const issuer1IdCases: IdentifierTestCase[] = [
        {
          identifier,
          signer,
        },
        {
          identifier: identifier2,
          signer,
        },
      ]
      const issuer2IdCases: IdentifierTestCase[] = [
        {
          identifier,
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
        for (const { issuerN, idCasesPerIssuer } of [
          { issuerN: issuer, idCasesPerIssuer: issuer1IdCases },
          { issuerN: issuer2, idCasesPerIssuer: issuer2IdCases },
        ]) {
          for (const idCase of idCasesPerIssuer) {
            await signAndRegisterAttestation(
              idCase.identifier,
              issuerN,
              account,
              issuedOn,
              idCase.signer
            )
          }
        }
      })

      it('should return all identifiers from one issuer', async () => {
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account,
          [issuer],
          issuer1IdCases.length + 1
        )
        checkAgainstExpectedIdCases(issuer1IdCases, actualIdentifiers)
      })

      it('should return empty list if no identifiers exist for an (issuer,address)', async () => {
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account,
          [issuer3],
          1
        )
        assert.equal(actualIdentifiers.length, 0)
      })

      it('should return identifiers from multiple issuers in correct order', async () => {
        const expectedIdCases = issuer2IdCases.concat(issuer1IdCases)
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account,
          [issuer3, issuer2, issuer],
          expectedIdCases.length + 1
        )
        checkAgainstExpectedIdCases(expectedIdCases, actualIdentifiers)
      })

      it('should return empty list if maxIdentifiers == 0', async () => {
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account,
          [issuer],
          0
        )
        assert.equal(actualIdentifiers.length, 0)
      })

      it('should only return maxIdentifiers identifiers when more are present', async () => {
        const expectedIdCases = issuer2IdCases.concat(issuer1IdCases).slice(0, -1)
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account,
          [issuer2, issuer],
          expectedIdCases.length
        )
        checkAgainstExpectedIdCases(expectedIdCases, actualIdentifiers)
      })

      it('should not return identifiers from revoked signers', async () => {
        await federatedAttestations.revokeSigner(issuer2IdCases[0].signer)
        const expectedIdCases = issuer2IdCases.slice(1)
        const actualIdentifiers = await federatedAttestations.lookupIdentifiersByAddress(
          account,
          [issuer2],
          expectedIdCases.length + 1
        )
        checkAgainstExpectedIdCases(expectedIdCases, actualIdentifiers)
      })
    })
  })

  describe('#isValidAttestation', async () => {
    describe('with an authorized AttestationSigner', async () => {
      beforeEach(async () => {
        await accountsInstance.authorizeSigner(signer, signerRole, { from: issuer })
        await accountsInstance.completeSignerAuthorization(issuer, signerRole, { from: signer })
      })

      it('should return true if a valid signature is used', async () => {
        assert.isTrue(
          await federatedAttestations.isValidAttestation(
            identifier,
            issuer,
            account,
            issuedOn,
            signer,
            sig.v,
            sig.r,
            sig.s
          )
        )
      })

      it('should return false if an invalid signature is provided', async () => {
        const sig2 = await getSignatureForAttestation(
          identifier,
          issuer,
          account,
          issuedOn,
          accounts[3],
          chainId,
          federatedAttestations.address
        )
        assert.isFalse(
          await federatedAttestations.isValidAttestation(
            identifier,
            issuer,
            account,
            issuedOn,
            signer,
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
        [3, 'issuedOn', issuedOn - 1],
        [4, 'signer', accounts[3]],
      ]
      wrongArgs.forEach(([index, arg, wrongValue]) => {
        it(`should fail if the provided ${arg} is different from the attestation`, async () => {
          let args = [identifier, issuer, account, issuedOn, signer, sig.v, sig.r, sig.s]
          args[index] = wrongValue

          if (arg == 'issuer' || arg == 'signer') {
            await assertRevert(
              federatedAttestations.isValidAttestation.apply(this, args),
              'Signer has not been authorized as an AttestationSigner by the issuer'
            )
          } else {
            assert.isFalse(await federatedAttestations.isValidAttestation.apply(this, args))
          }
        })
      })

      it('should revert if the signer is revoked', async () => {
        await federatedAttestations.revokeSigner(signer)
        await assertRevert(
          federatedAttestations.isValidAttestation(
            identifier,
            issuer,
            account,
            issuedOn,
            signer,
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
          identifier,
          issuer,
          account,
          issuedOn,
          signer,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })

    it('should revert if the signer is authorized as a different role by the issuer', async () => {
      const role = keccak256('random')
      await accountsInstance.authorizeSigner(signer, role, { from: issuer })
      await accountsInstance.completeSignerAuthorization(issuer, role, { from: signer })

      await assertRevert(
        federatedAttestations.isValidAttestation(
          identifier,
          issuer,
          account,
          issuedOn,
          signer,
          sig.v,
          sig.r,
          sig.s
        )
      )
    })
  })

  describe('#registerAttestation', () => {
    beforeEach(async () => {
      await accountsInstance.authorizeSigner(signer, signerRole, { from: issuer })
      await accountsInstance.completeSignerAuthorization(issuer, signerRole, { from: signer })
    })

    // TODO ASv2: add case for when issuer == signer

    it('should emit AttestationRegistered for a valid attestation', async () => {
      const register = await federatedAttestations.registerAttestation(
        identifier,
        issuer,
        account,
        issuedOn,
        signer,
        sig.v,
        sig.r,
        sig.s
      )
      assertLogMatches2(register.logs[0], {
        event: 'AttestationRegistered',
        args: {
          identifier,
          issuer,
          account,
          issuedOn,
          signer,
        },
      })
    })

    it('should revert if an invalid signature is provided', async () => {
      const sig2 = await getSignatureForAttestation(
        identifier,
        issuer,
        account,
        issuedOn,
        accounts[3],
        chainId,
        federatedAttestations.address
      )
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier,
          issuer,
          account,
          issuedOn,
          signer,
          sig2.v,
          sig2.r,
          sig2.s
        )
      )
    })

    describe('when registering a second attestation', () => {
      beforeEach(async () => {
        // register first attestation
        await federatedAttestations.registerAttestation(
          identifier,
          issuer,
          account,
          issuedOn,
          signer,
          sig.v,
          sig.r,
          sig.s
        )
      })

      it('should revert if an attestation with the same (issuer, identifier, account) is uploaded again', async () => {
        // Upload the same attestation signed by a different signer, authorized under the same issuer
        const signer2 = accounts[4]
        await accountsInstance.authorizeSigner(signer2, signerRole, { from: issuer })
        await accountsInstance.completeSignerAuthorization(issuer, signerRole, { from: signer2 })
        const sig2 = await getSignatureForAttestation(
          identifier,
          issuer,
          account,
          issuedOn + 1,
          signer2,
          1,
          federatedAttestations.address
        )
        await assertRevert(
          federatedAttestations.registerAttestation(
            identifier,
            issuer,
            account,
            issuedOn,
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
          issuer,
          account,
          issuedOn,
          signer,
          chainId,
          federatedAttestations.address
        )
        const register2 = await federatedAttestations.registerAttestation(
          identifier2,
          issuer,
          account,
          issuedOn,
          signer,
          sig2.v,
          sig2.r,
          sig2.s
        )
        assertLogMatches2(register2.logs[0], {
          event: 'AttestationRegistered',
          args: {
            identifier: identifier2,
            issuer,
            account,
            issuedOn,
            signer,
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
          identifier,
          issuer2,
          account,
          issuedOn,
          signer2,
          chainId,
          federatedAttestations.address
        )
        const register2 = await federatedAttestations.registerAttestation(
          identifier,
          issuer2,
          account,
          issuedOn,
          signer2,
          sig2.v,
          sig2.r,
          sig2.s,
          { from: issuer2 }
        )
        assertLogMatches2(register2.logs[0], {
          event: 'AttestationRegistered',
          args: {
            identifier,
            issuer: issuer2,
            account,
            issuedOn,
            signer: signer2,
          },
        })
      })

      it('should succeed with a different account', async () => {
        const account2 = accounts[4]
        const sig2 = await getSignatureForAttestation(
          identifier,
          issuer,
          account2,
          issuedOn,
          signer,
          chainId,
          federatedAttestations.address
        )
        const register2 = await federatedAttestations.registerAttestation(
          identifier,
          issuer,
          account2,
          issuedOn,
          signer,
          sig2.v,
          sig2.r,
          sig2.s,
          { from: issuer, gasPrice: 0 }
        )
        assertLogMatches2(register2.logs[0], {
          event: 'AttestationRegistered',
          args: {
            identifier,
            issuer,
            account: account2,
            issuedOn,
            signer,
          },
        })
      })
    })

    it('should revert if an invalid user attempts to register the attestation', async () => {
      await assertRevert(
        federatedAttestations.registerAttestation(
          identifier,
          issuer,
          account,
          issuedOn,
          signer,
          sig.v,
          sig.r,
          sig.s,
          { from: accounts[4] }
        )
      )
    })

    it('should succeed if a different AttestationSigner authorized by the same issuer registers the attestation', async () => {
      const signer2 = accounts[4]
      await accountsInstance.authorizeSigner(signer2, signerRole, { from: issuer })
      await accountsInstance.completeSignerAuthorization(issuer, signerRole, { from: signer2 })
      const register = await federatedAttestations.registerAttestation(
        identifier,
        issuer,
        account,
        issuedOn,
        signer,
        sig.v,
        sig.r,
        sig.s,
        { from: signer2 }
      )
      assertLogMatches2(register.logs[0], {
        event: 'AttestationRegistered',
        args: {
          identifier,
          issuer,
          account,
          issuedOn,
          signer,
        },
      })
    })
  })

  describe('#deleteAttestation', () => {
    it('should', async () => {})
  })
})
