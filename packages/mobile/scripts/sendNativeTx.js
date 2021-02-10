const contractKit = require('@celo/contractkit')
const celoUtils = require('@celo/utils/lib/account')

const WEI_PER_CELO = 1000000000000000000.0

const args = process.argv.slice(2)
const parsedArgs = args.reduce((acc, arg) => {
  const [key, value] = arg.split('=')
  acc[key.replace(/-/g, '')] = value
  return acc
}, {})

const isAddressFormat = (content) => {
  if (!content) return false
  return content.startsWith('0x') && content.length === 42
}

if (!isAddressFormat(parsedArgs.from) || !isAddressFormat(parsedArgs.to)) {
  console.log(
    'from and to are required. You can pass them as parameters with --from={fromAddress} --to={toAddress}'
  )
  return
}

if (!parsedArgs.mnemonic || parsedArgs.mnemonic.split(' ').length !== 24) {
  console.log(
    'mnemonic is required. You can pass it as parameter with --mnemonic="all 24 mnemonic words"'
  )
}

const isNumber = (value) => {
  try {
    return parseFloat(value) > 0
  } catch (error) {
    return false
  }
}

if (!isNumber(parsedArgs.value)) {
  console.log(
    'value is required and should be a number. It will be multiplied by 1e18. You can pass it as parameter with --value=1.5'
  )
  return
}
const value = parseFloat(parsedArgs.value) * WEI_PER_CELO

const env = parsedArgs.env || 'alfajores'
console.log(`Using environment ${env}. You can set it with --env={environment}`)

const kit = contractKit.newKit(
  {
    alfajores: 'https://alfajores-forno.celo-testnet.org',
    mainnet: 'https://forno.celo.org',
  }[env]
)

const sendNativeCelo = async () => {
  const keys = await celoUtils.generateKeys(parsedArgs.mnemonic)
  const privateKey = keys.privateKey
  kit.addAccount(privateKey)

  const tx = await kit.sendTransaction({
    from: parsedArgs.from,
    to: parsedArgs.to,
    value: value,
  })
  const receipt = await tx.waitReceipt()
  console.log(receipt)
}

sendNativeCelo()
