import { Address, normalizeAddress } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { GET_IMPLEMENTATION_ABI } from '@celo/contractkit/lib/governance/proxy'
import Proxy from '@celo/protocol/build/contracts/Proxy.json'
import { EventLog } from 'web3-core'
import { InvalidWallet, WalletIntegrityIssue } from './errors'

// XXX: Because of how we have things set up
// There's no easy way to cherry-pick the type
// of an event from the generated types :(
interface DeployWalletLog extends EventLog {
  returnValues: {
    owner: string
    wallet: string
    implementation: string
    0: string
    1: string
    2: string
  }
}

export const verifyWallet = async (
  contractKit: ContractKit,
  deployLog: DeployWalletLog,
  implementation: Address,
  signer: Address
): Promise<Result<true, InvalidWallet>> => {
  const code = await contractKit.web3.eth.getCode(deployLog.returnValues.wallet)
  if (stripBzz(code) !== stripBzz(Proxy.deployedBytecode)) {
    console.log(code)
    console.log(Proxy.deployedBytecode)
    return Err(new InvalidWallet(WalletIntegrityIssue.WrongProxyBytecode))
  }

  const actualImplementationRaw = await contractKit.web3.eth.call({
    to: deployLog.returnValues.wallet,
    data: GET_IMPLEMENTATION_ABI.signature,
  })
  const actualImplementation = normalizeAddress(actualImplementationRaw.slice(26, 66))

  if (normalizeAddress(implementation) !== actualImplementation) {
    console.log(implementation)
    console.log(actualImplementation)
    return Err(new InvalidWallet(WalletIntegrityIssue.WrongImplementation))
  }

  const wallet = await contractKit.contracts.getMetaTransactionWallet(deployLog.returnValues.wallet)
  const actualSigner = await wallet.signer()
  if (normalizeAddress(signer) !== normalizeAddress(actualSigner)) {
    console.log(signer)
    console.log(actualSigner)
    return Err(new InvalidWallet(WalletIntegrityIssue.WrongSigner))
  }

  return Ok(true)
}

function stripBzz(bytecode: string): string {
  return bytecode.split('a265627a7a72315820')[0]
}
