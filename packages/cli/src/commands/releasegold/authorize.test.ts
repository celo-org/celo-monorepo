import { newKitFromWeb3 } from '@celo/contractkit'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { serializeSignature } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import Authorize from './authorize'
import CreateAccount from './create-account'

process.env.NO_SYNCCHECK = 'true'

// function parseEvents(receipt: TransactionReceipt | undefined) {
//   if (!receipt) {
//     return []
//   }
//   if (receipt.events && receipt.events.Transfer) {
//     let events: any = receipt.events.Transfer
//     if (!(events instanceof Array)) {
//       events = [events]
//     }
//     return events.map((a: any) => ({ to: a.returnValues.to, from: a.returnValues.from }))
//   }
//   if (receipt.logs) {
//     return receipt.logs
//       .filter((a) => a.topics[0] === TRANSFER_TOPIC)
//       .map((a) => ({ to: truncateTopic(a.topics[2]), from: truncateTopic(a.topics[1]) }))
//   }
// }
testWithGanache('account:authorize cmd', (web3: Web3) => {
  let contractAddress: string
  const kit = newKitFromWeb3(web3)

  beforeAll(async () => {
    let currBlockNumber = await web3.eth.getBlockNumber()
    let currBlock: any
    const target = web3.utils.sha3('ReleaseGoldInstanceCreated(address,address)')
    while (true) {
      currBlock = await web3.eth.getBlock(currBlockNumber)
      for (const tx of currBlock.transactions) {
        const txFull = await web3.eth.getTransactionReceipt(tx)
        if (txFull.logs) {
          for (const log of txFull.logs) {
            if (log.topics) {
              for (const topic of log.topics) {
                if (topic === target) {
                  contractAddress = log.address
                }
              }
            }
          }
        }
      }
      currBlockNumber--
      if (contractAddress !== undefined) break
      if (currBlockNumber < 0) {
        throw Error('Error: ReleaseGoldInstance could not be found')
      }
    }
  })

  test('can authorize account', async () => {
    const accounts = await web3.eth.getAccounts()
    const accountsWrapper = await kit.contracts.getAccounts()
    await CreateAccount.run(['--contract', contractAddress])
    const pop = await accountsWrapper.generateProofOfKeyPossession(contractAddress, accounts[1])
    await Authorize.run([
      '--contract',
      contractAddress,
      '--action',
      'vote',
      '--signer',
      accounts[1],
      '--pop',
      serializeSignature(pop),
    ])
  })

  test('can authorize account and bls', async () => {
    const accounts = await web3.eth.getAccounts()
    const newBlsPublicKey = web3.utils.randomHex(96)
    const newBlsPoP = web3.utils.randomHex(48)
    const ecdsaPublicKey = await addressToPublicKey(accounts[0], web3.eth.sign)
    await Register.run(['--from', accounts[0]])
    await Lock.run(['--from', accounts[0], '--value', '10000000000000000000000'])
    await ValidatorRegister.run([
      '--from',
      accounts[0],
      '--ecdsaKey',
      ecdsaPublicKey,
      '--blsKey',
      '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsSignature',
      '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
      '--yes',
    ])
    await Authorize.run([
      '--from',
      accounts[0],
      '--role',
      'validator',
      '--signer',
      accounts[1],
      '--signature',
      '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
      '--blsKey',
      newBlsPublicKey,
      '--blsPop',
      newBlsPoP,
    ])
  })

  // test('fails if from is not an account', async () => {
  //   const accounts = await web3.eth.getAccounts()
  //   await expect(
  //     Authorize.run([
  //       '--from',
  //       accounts[0],
  //       '--role',
  //       'validator',
  //       '--signer',
  //       accounts[1],
  //       '--signature',
  //       '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
  //     ])
  //   ).rejects.toThrow()
  // })
})
