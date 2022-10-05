import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { FederatedAttestationsWrapper } from './FederatedAttestations'

testWithGanache('FederatedAttestations Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let federatedAttestations: FederatedAttestationsWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
  })

  it('no identifiers should exist if none were registered', async () => {
    federatedAttestations = await kit.contracts.getFederatedAttestations()
    const testAccount = kit.web3.eth.accounts.create()
    const testIssuer = kit.web3.eth.accounts.create()
    const identifiers = await federatedAttestations.lookupIdentifiers(testAccount.address, [
      testIssuer.address,
    ])

    expect(identifiers).toEqual({
      '0': ['0'],
      '1': [],
      countsPerIssuer: ['0'],
      identifiers: [],
    })
  })

  it('no attestations should exist if none were registered', async () => {
    federatedAttestations = await kit.contracts.getFederatedAttestations()
    const testIdentifierAddress = kit.web3.eth.accounts.create().address
    const testIdentifierBytes32 = kit.web3.utils.soliditySha3({
      t: 'bytes32',
      v: testIdentifierAddress,
    })

    const attestations = await federatedAttestations.lookupAttestations(
      testIdentifierBytes32 as string,
      [kit.defaultAccount as string]
    )

    expect(attestations).toEqual({
      '0': ['0'],
      '1': [],
      '2': [],
      '3': [],
      '4': [],
      accounts: [],
      countsPerIssuer: ['0'],
      issuedOns: [],
      publishedOns: [],
      signers: [],
    })
  })
  it('attestation should exist when registered and not when revoked', async () => {
    federatedAttestations = await kit.contracts.getFederatedAttestations()
    const testIdentifierAddress = kit.web3.eth.accounts.create().address
    const testAccount = kit.web3.eth.accounts.create().address
    const testIssuedOnTimestamp = Math.floor(new Date().getTime() / 1000)
    const testIdentifierBytes32 = kit.web3.utils.soliditySha3({
      t: 'bytes32',
      v: testIdentifierAddress,
    })

    await federatedAttestations
      .registerAttestationAsIssuer(
        testIdentifierBytes32 as string,
        testAccount,
        testIssuedOnTimestamp
      )
      .send()

    const attestations = await federatedAttestations.lookupAttestations(
      testIdentifierBytes32 as string,
      [kit.defaultAccount as string]
    )

    const identifiers = await federatedAttestations.lookupIdentifiers(testAccount as string, [
      kit.defaultAccount as string,
    ])

    expect(attestations[1]).toEqual([testAccount])
    expect(attestations[2]).toEqual([kit.defaultAccount])
    expect(identifiers[0]).toEqual(['1'])
    expect(identifiers[1]).toEqual([testIdentifierBytes32])

    await federatedAttestations
      .revokedAttestations(
        testIdentifierBytes32 as string,
        kit.defaultAccount as string,
        testAccount
      )
      .send()

    const attestationsAfterRevocation = await federatedAttestations.lookupAttestations(
      testIdentifierBytes32 as string,
      [kit.defaultAccount as string]
    )

    expect(attestationsAfterRevocation).toEqual({
      '0': ['0'],
      '1': [],
      '2': [],
      '3': [],
      '4': [],
      accounts: [],
      countsPerIssuer: ['0'],
      issuedOns: [],
      publishedOns: [],
      signers: [],
    })
  })
})
