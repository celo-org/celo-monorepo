import { newKitFromWeb3 } from '@celo/contractkit'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { addressToPublicKey, serializeSignature } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import ValidatorRegister from '../validator/register'
import Authorize from './authorize'
import CreateAccount from './create-account'
import LockedGold from './locked-gold'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:authorize cmd', (web3: Web3) => {
  let contractAddress: string
  let kit: any

  beforeEach(async () => {
    const contractCanValidate = true
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      contractCanValidate
    )
    kit = newKitFromWeb3(web3)
    await CreateAccount.run(['--contract', contractAddress])
  })

  describe('can authorize account signers', () => {
    let pop: any
    let accounts: any

    beforeEach(async () => {
      accounts = await web3.eth.getAccounts()
      const accountsWrapper = await kit.contracts.getAccounts()
      pop = await accountsWrapper.generateProofOfKeyPossession(contractAddress, accounts[1])
    })

    test('can authorize account vote signer ', async () => {
      await Authorize.run([
        '--contract',
        contractAddress,
        '--role',
        'vote',
        '--signer',
        accounts[1],
        '--signature',
        serializeSignature(pop),
      ])
    })

    test('can authorize account validator signer', async () => {
      await Authorize.run([
        '--contract',
        contractAddress,
        '--role',
        'validator',
        '--signer',
        accounts[1],
        '--signature',
        serializeSignature(pop),
      ])
    })

    test('can authorize account attestation signer', async () => {
      await Authorize.run([
        '--contract',
        contractAddress,
        '--role',
        'attestation',
        '--signer',
        accounts[1],
        '--signature',
        serializeSignature(pop),
      ])
    })
  })

  test('can register as a validator from an authorized signer', async () => {
    const accounts = await web3.eth.getAccounts()
    const accountsWrapper = await kit.contracts.getAccounts()
    const signer = accounts[1]
    const pop = await accountsWrapper.generateProofOfKeyPossession(contractAddress, signer)
    const ecdsaPublicKey = await addressToPublicKey(signer, web3.eth.sign)
    await LockedGold.run([
      '--contract',
      contractAddress,
      '--action',
      'lock',
      '--value',
      '10000000000000000000000',
      '--yes',
    ])
    await Authorize.run([
      '--contract',
      contractAddress,
      '--role',
      'validator',
      '--signer',
      signer,
      '--signature',
      serializeSignature(pop),
    ])
    await ValidatorRegister.run([
      '--from',
      signer,
      '--ecdsaKey',
      ecdsaPublicKey,
      '--blsKey',
      '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsSignature',
      '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
      '--yes',
    ])
  })

  test('can authorize signer with bls keys after registering as validator', async () => {
    const accounts = await web3.eth.getAccounts()
    const accountsWrapper = await kit.contracts.getAccounts()
    const signer = accounts[1]
    const pop = await accountsWrapper.generateProofOfKeyPossession(contractAddress, signer)
    const ecdsaPublicKey = await addressToPublicKey(signer, web3.eth.sign)

    const signerBLS = accounts[2]
    const popBLS = await accountsWrapper.generateProofOfKeyPossession(contractAddress, signerBLS)
    const newBlsPublicKey = web3.utils.randomHex(96)
    const newBlsPoP = web3.utils.randomHex(48)

    await LockedGold.run([
      '--contract',
      contractAddress,
      '--action',
      'lock',
      '--value',
      '10000000000000000000000',
      '--yes',
    ])
    await Authorize.run([
      '--contract',
      contractAddress,
      '--role',
      'validator',
      '--signer',
      signer,
      '--signature',
      serializeSignature(pop),
    ])
    await ValidatorRegister.run([
      '--from',
      signer,
      '--ecdsaKey',
      ecdsaPublicKey,
      '--blsKey',
      '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsSignature',
      '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
      '--yes',
    ])
    await Authorize.run([
      '--contract',
      contractAddress,
      '--role',
      'validator',
      '--signer',
      signerBLS,
      '--signature',
      serializeSignature(popBLS),
      '--blsKey',
      newBlsPublicKey,
      '--blsPop',
      newBlsPoP,
    ])
  })

  test('fails if contract is not registered as an account', async () => {
    const accounts = await web3.eth.getAccounts()
    await expect(
      Authorize.run([
        '--contract',
        contractAddress,
        '--role',
        'validator',
        '--signer',
        accounts[1],
        '--signature',
        '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
      ])
    ).rejects.toThrow()
  })
})
