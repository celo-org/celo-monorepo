import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { FederatedAttestationsWrapper } from './FederatedAttestations'

testWithGanache('FederatedAttestations Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  const TIME_STAMP = 1665080820
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
    const identifiers = await federatedAttestations.lookupIdentifiers(testAccountAddress, [
      accounts[0],
    ])
    expect(identifiers.countsPerIssuer).toEqual(['0'])
    expect(identifiers.identifiers).toEqual([])
  })

  it('no attestations should exist if none were registered', async () => {
    const attestations = await federatedAttestations.lookupAttestations(testIdentifierBytes32, [
      accounts[0],
    ])

    expect(attestations.countsPerIssuer).toEqual(['0'])
    expect(attestations.accounts).toEqual([])
    expect(attestations.signers).toEqual([])
    expect(attestations.issuedOns).toEqual([])
    expect(attestations.publishedOns).toEqual([])
  })

  it('attestation and identifiers should exist after registerAttestation is called', async () => {
    const issuer = accounts[1]
    const account = accounts[3]

    const accountInstance = await kit.contracts.getAccounts()
    await accountInstance.createAccount().sendAndWaitForReceipt({ from: issuer })

    // Ganache returns 1 in chainId assembly code
    // @ts-ignore
    jest.spyOn<any, any>(kit.connection, 'chainId').mockReturnValue(1)

    const celoTransactionObject = await federatedAttestations.registerAttestation(
      testIdentifierBytes32,
      issuer,
      account,
      issuer,
      TIME_STAMP
    )

    await celoTransactionObject.sendAndWaitForReceipt()

    const attestationsAfterRegistration = await federatedAttestations.lookupAttestations(
      testIdentifierBytes32,
      [issuer]
    )

    const identifiersAfterRegistration = await federatedAttestations.lookupIdentifiers(account, [
      issuer,
    ])

    expect(attestationsAfterRegistration.countsPerIssuer).toEqual(['1'])
    expect(attestationsAfterRegistration.accounts).toEqual([account])
    expect(attestationsAfterRegistration.signers).toEqual([issuer])
    expect(attestationsAfterRegistration.issuedOns).toEqual([`${TIME_STAMP}`])
    expect(attestationsAfterRegistration.publishedOns[0]).toBeDefined()

    expect(identifiersAfterRegistration.countsPerIssuer).toEqual(['1'])
    expect(identifiersAfterRegistration.identifiers).toEqual([testIdentifierBytes32])
  })

  it('attestation should exist when registered and not when revoked', async () => {
    await federatedAttestations
      .registerAttestationAsIssuer(testIdentifierBytes32, testAccountAddress, TIME_STAMP)
      .sendAndWaitForReceipt()

    const attestationsAfterRegistration = await federatedAttestations.lookupAttestations(
      testIdentifierBytes32,
      [accounts[0]]
    )

    const identifiersAfterRegistration = await federatedAttestations.lookupIdentifiers(
      testAccountAddress,
      [accounts[0]]
    )

    expect(attestationsAfterRegistration.countsPerIssuer).toEqual(['1'])
    expect(attestationsAfterRegistration.accounts).toEqual([testAccountAddress])
    expect(attestationsAfterRegistration.signers).toEqual([accounts[0]])
    expect(attestationsAfterRegistration.issuedOns).toEqual([`${TIME_STAMP}`])
    expect(attestationsAfterRegistration.publishedOns[0]).toBeDefined()

    expect(identifiersAfterRegistration.countsPerIssuer).toEqual(['1'])
    expect(identifiersAfterRegistration.identifiers).toEqual([testIdentifierBytes32])

    await federatedAttestations
      .revokeAttestation(testIdentifierBytes32, accounts[0], testAccountAddress)
      .sendAndWaitForReceipt()

    const attestationsAfterRevocation = await federatedAttestations.lookupAttestations(
      testIdentifierBytes32,
      [accounts[0]]
    )

    const identifiersAfterRevocation = await federatedAttestations.lookupIdentifiers(
      testAccountAddress,
      [accounts[0]]
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
    const secondIdentifierBytes32 = kit.web3.utils.soliditySha3({
      t: 'bytes32',
      v: '1600 Pennsylvania Avenue, Washington, D.C., USA',
    }) as string

    await federatedAttestations
      .registerAttestationAsIssuer(testIdentifierBytes32, testAccountAddress, TIME_STAMP)
      .sendAndWaitForReceipt()

    await federatedAttestations
      .registerAttestationAsIssuer(secondIdentifierBytes32, testAccountAddress, TIME_STAMP)
      .sendAndWaitForReceipt()

    const identifiersAfterRegistration = await federatedAttestations.lookupIdentifiers(
      testAccountAddress,
      [accounts[0]]
    )

    expect(identifiersAfterRegistration.countsPerIssuer).toEqual(['2'])
    expect(identifiersAfterRegistration.identifiers).toEqual([
      testIdentifierBytes32,
      secondIdentifierBytes32,
    ])

    await federatedAttestations
      .batchRevokeAttestations(
        accounts[0],
        [testIdentifierBytes32, secondIdentifierBytes32],
        [testAccountAddress, testAccountAddress]
      )
      .sendAndWaitForReceipt()

    const identifiersAfterBatchRevocation = await federatedAttestations.lookupIdentifiers(
      testAccountAddress,
      [accounts[0]]
    )

    expect(identifiersAfterBatchRevocation.countsPerIssuer).toEqual(['0'])
    expect(identifiersAfterBatchRevocation.identifiers).toEqual([])
  })
})
