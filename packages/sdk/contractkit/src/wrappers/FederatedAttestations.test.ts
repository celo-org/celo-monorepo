import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { FederatedAttestationsWrapper } from './FederatedAttestations'

testWithGanache('FederatedAttestations Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let federatedAttestations: FederatedAttestationsWrapper
  let testIdentifierBytes32: string
  let plainTextIdentifier: string
  let testAccountAddress: string

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    federatedAttestations = await kit.contracts.getFederatedAttestations()
    testAccountAddress = kit.web3.eth.accounts.create().address
    plainTextIdentifier = '221B Baker St., London'
    testIdentifierBytes32 = kit.web3.utils.soliditySha3({
      t: 'bytes32',
      v: plainTextIdentifier,
    }) as string
  })

  it('no identifiers should exist if none were registered', async () => {
    const testIssuer = kit.web3.eth.accounts.create()
    const identifiers = await federatedAttestations.lookupIdentifiers(testAccountAddress, [
      testIssuer.address,
    ])

    expect(identifiers.countsPerIssuer).toEqual(['0'])
    expect(identifiers.identifiers).toEqual([])
  })

  it('no attestations should exist if none were registered', async () => {
    const attestations = await federatedAttestations.lookupAttestations(testIdentifierBytes32, [
      kit.defaultAccount as string,
    ])

    expect(attestations.countsPerIssuer).toEqual(['0'])
    expect(attestations.accounts).toEqual([])
    expect(attestations.signers).toEqual([])
    expect(attestations.issuedOns).toEqual([])
    expect(attestations.publishedOns).toEqual([])
  })
  it('attestation should exist when registered and not when revoked', async () => {
    const testIssuedOnTimestamp = Math.floor(new Date().getTime() / 1000)

    await federatedAttestations
      .registerAttestationAsIssuer(testIdentifierBytes32, testAccountAddress, testIssuedOnTimestamp)
      .sendAndWaitForReceipt()

    const attestationsAfterRegistration = await federatedAttestations.lookupAttestations(
      testIdentifierBytes32,
      [kit.defaultAccount as string]
    )

    const identifiersAfterRegistration = await federatedAttestations.lookupIdentifiers(
      testAccountAddress,
      [kit.defaultAccount as string]
    )

    expect(attestationsAfterRegistration.countsPerIssuer).toEqual(['1'])
    expect(attestationsAfterRegistration.accounts).toEqual([testAccountAddress])
    expect(attestationsAfterRegistration.signers).toEqual([kit.defaultAccount])
    expect(attestationsAfterRegistration.issuedOns).toEqual([`${testIssuedOnTimestamp}`])
    expect(attestationsAfterRegistration.publishedOns[0]).toBeDefined()

    expect(identifiersAfterRegistration.countsPerIssuer).toEqual(['1'])
    expect(identifiersAfterRegistration.identifiers).toEqual([testIdentifierBytes32])

    await federatedAttestations
      .revokeAttestation(testIdentifierBytes32, kit.defaultAccount as string, testAccountAddress)
      .sendAndWaitForReceipt()

    const attestationsAfterRevocation = await federatedAttestations.lookupAttestations(
      testIdentifierBytes32,
      [kit.defaultAccount as string]
    )

    const identifiersAfterRevocation = await federatedAttestations.lookupIdentifiers(
      testAccountAddress,
      [kit.defaultAccount as string]
    )

    expect(attestationsAfterRevocation.countsPerIssuer).toEqual(['0'])
    expect(attestationsAfterRevocation.accounts).toEqual([])
    expect(attestationsAfterRevocation.signers).toEqual([])
    expect(attestationsAfterRevocation.issuedOns).toEqual([])
    expect(attestationsAfterRevocation.publishedOns).toEqual([])

    expect(identifiersAfterRevocation.countsPerIssuer).toEqual(['0'])
    expect(identifiersAfterRevocation.identifiers).toEqual([])
  })
  it('batch revoke attestations should remove all attestations specified ', async () => {
    const testIssuedOnTimestamp = Math.floor(new Date().getTime() / 1000)

    const secondIdentifierBytes32 = kit.web3.utils.soliditySha3({
      t: 'bytes32',
      v: '1600 Pennsylvania Avenue, Washington, D.C., USA',
    }) as string

    await federatedAttestations
      .registerAttestationAsIssuer(testIdentifierBytes32, testAccountAddress, testIssuedOnTimestamp)
      .sendAndWaitForReceipt()

    await federatedAttestations
      .registerAttestationAsIssuer(
        secondIdentifierBytes32,
        testAccountAddress,
        testIssuedOnTimestamp
      )
      .sendAndWaitForReceipt()

    const identifiersAfterRegistration = await federatedAttestations.lookupIdentifiers(
      testAccountAddress,
      [kit.defaultAccount as string]
    )

    expect(identifiersAfterRegistration.countsPerIssuer).toEqual(['2'])
    expect(identifiersAfterRegistration.identifiers).toEqual([
      testIdentifierBytes32,
      secondIdentifierBytes32,
    ])
  })
})
