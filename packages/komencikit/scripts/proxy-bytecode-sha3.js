const Proxy = require('@celo/protocol/build/contracts/Proxy.json')
const Web3 = require('web3')

console.log('Constructing stripped bytecode SHA3 for the Proxy contract')
const bytecode = Proxy.deployedBytecode.split('a265627a7a72315820')[0]
console.log('Bytecode hash:', Web3.utils.soliditySha3(bytecode))
