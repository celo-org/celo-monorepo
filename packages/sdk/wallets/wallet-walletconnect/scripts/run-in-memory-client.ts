import { newKit } from '@celo/contractkit'
// import {
//   // ensureLeading0x,
//   privateKeyToPublicKey,
//   trimLeading0x,
// } from '@celo/utils/lib/address'
// import { ECIES } from '@celo/utils/lib/ecies'
// import * as readline from 'readline'
// import {
//   serializeSignature,
//   verifyEIP712TypedDataSigner,
//   verifySignature,
// } from '@celo/utils/src/signatureUtils'
import { WalletConnectWallet } from '../src'
import { stagingEndpoint } from '../src/constants'
async function main() {
  const name = `CLI DApp ${Math.random().toString().substring(12)}`

  const wallet = new WalletConnectWallet({
    connect: {
      metadata: {
        name,
        description: 'A CLI DApp for testing WalletConnect integrations',
        url: 'https://use-contractkit.vercel.app',
        icons: [],
      },
    },
    init: {
      relayProvider: stagingEndpoint,
      logger: 'error',
    },
  })

  const uri = await wallet.getUri()
  if (!uri) {
    console.error('No connection URI, something has gone terribly wrong')
    process.exit(1)
  }

  console.log(`=== START OUT OF BAND URI FOR ${name} ===
${uri.toString()}
=== END OUT OF BAND URI ===`)
  await wallet.init()

  const [from] = await wallet.getAccounts()
  const kit = newKit('https://alfajores-forno.celo-testnet.org', wallet)

  /**
   * Uncomment to send a test transaction
   */
  // async function transfer() {
  //   try {
  //     const gold = await kit.contracts.getGoldToken()
  //     await gold
  //       .transfer('0x4132F04EaCfdE9E2b707667A13CB69DbC5BABb68', '1')
  //       .sendAndWaitForReceipt({ from })
  //     console.log('Transaction sent!')
  //   } catch (e) {
  //     console.log('Failed', e.message)
  //   }
  // }
  // await transfer()

  /**
   * Uncomment to sign a test payload
   */
  // await kit.connection.sign(ensureLeading0x(Buffer.from('hello').toString()), from)
  // console.log('Payload signed!')

  /**
   * Uncomment to hold connection open
   */
  // await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 60 * 24))

  /**
   * Uncomment to sign a EIP712 typed data payload.
   */
  // async function sendTypedData() {
  //   const TYPED_DATA = {
  //     types: {
  //       EIP712Domain: [
  //         { name: 'name', type: 'string' },
  //         { name: 'version', type: 'string' },
  //         { name: 'chainId', type: 'uint256' },
  //         { name: 'verifyingContract', type: 'address' },
  //       ],
  //       Person: [
  //         { name: 'name', type: 'string' },
  //         { name: 'wallet', type: 'address' },
  //       ],
  //       Mail: [
  //         { name: 'from', type: 'Person' },
  //         { name: 'to', type: 'Person' },
  //         { name: 'contents', type: 'string' },
  //       ],
  //     },
  //     primaryType: 'Mail',
  //     domain: {
  //       name: 'Ether Mail',
  //       version: '1',
  //       chainId: 1,
  //       verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  //     },
  //     message: {
  //       from: {
  //         name: 'Cow',
  //         wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
  //       },
  //       to: {
  //         name: 'Bob',
  //         wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
  //       },
  //       contents: 'Hello, Bob!',
  //     },
  //   }
  //   try {
  //     console.log('sending typed data request')
  //     const signedData = await kit.signTypedData(from, TYPED_DATA)
  //     console.log('signTypedData received: ', signedData)
  //     const valid = verifyEIP712TypedDataSigner(TYPED_DATA, serializeSignature(signedData), from)
  //     if (!valid) {
  //       throw new Error('signature is not valid')
  //     }
  //   } catch (e) {
  //     console.log('Failed:', e.message)
  //   }
  // }
  // await sendTypedData()

  /**
   * Uncomment to decrypt a personal message.
   * When prompted, enter the same PK as used in the test wallet;
   * optionally paste it below when running this frequently.
   */
  // async function decryptMessage() {
  //   try {
  //     console.log('sending personal decrypt message request')
  //     const message = "I'm a füñ˚k¥ message\n!"
  //     let rl = readline.createInterface({
  //       input: process.stdin,
  //       output: process.stdout,
  //     })
  //     const testPk: string = await new Promise((resolve) =>
  //       rl.question('Enter TEST private key:', (answer) => {
  //         rl.close()
  //         resolve(answer)
  //       })
  //     )
  //     // Can comment out above for repeated debugging
  //     // const testPk = 'YOUR_TEST_PK'
  //     const encryptedMessage = ECIES.Encrypt(
  //       Buffer.from(trimLeading0x(privateKeyToPublicKey(testPk)), 'hex'),
  //       Buffer.from(message)
  //     )
  //     const decryptedMessage = await wallet.decrypt(from, encryptedMessage!)

  //     console.log('decryptedMessage received: ', decryptedMessage.toString())
  //     if (decryptedMessage.toString() !== message) {
  //       throw new Error('signature is not valid')
  //     }
  //   } catch (e) {
  //     console.log('Failed:', e.message)
  //   }
  // }
  // await decryptMessage()

  await wallet.close()
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
