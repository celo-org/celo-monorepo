import { Address, normalizeAddress } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { GET_IMPLEMENTATION_ABI } from '@celo/contractkit/lib/governance/proxy'
import Proxy from '@celo/protocol/build/contracts/Proxy.json'
import {
  InvalidBytecode,
  InvalidImplementation,
  InvalidSigner,
  WalletValidationError,
} from './errors'

export const verifyWallet = async (
  contractKit: ContractKit,
  walletAddress: Address,
  allowedImplementations: Address[],
  expectedSigner: Address
): Promise<Result<true, WalletValidationError>> => {
  const code = await contractKit.web3.eth.getCode(walletAddress)
  // XXX: I'm unsure whether this is safe or if we should store the
  // bytecode as a constant in `mobile` and pass it into KomenciKit
  // I'm unsure if we should protect from the `Proxy` contract output
  // in protocol from changing, or there are already constraints put in
  // place for that not to happen.
  if (stripBzz(code) !== stripBzz(Proxy.deployedBytecode)) {
    return Err(new InvalidBytecode(walletAddress))
  }

  const actualImplementationRaw = await contractKit.web3.eth.call({
    to: walletAddress,
    data: GET_IMPLEMENTATION_ABI.signature,
  })
  const actualImplementation = normalizeAddress(actualImplementationRaw.slice(26, 66))
  const normalizedAllowedImplementations = allowedImplementations.map(normalizeAddress)

  if (normalizedAllowedImplementations.indexOf(actualImplementation) === -1) {
    return Err(
      new InvalidImplementation(
        walletAddress,
        actualImplementation,
        normalizedAllowedImplementations
      )
    )
  }

  const wallet = await contractKit.contracts.getMetaTransactionWallet(walletAddress)
  const actualSigner = normalizeAddress(await wallet.signer())
  const normalizedExpectedSigner = normalizeAddress(expectedSigner)
  if (actualSigner !== normalizedExpectedSigner) {
    return Err(new InvalidSigner(walletAddress, actualSigner, normalizedExpectedSigner))
  }

  return Ok(true)
}

function stripBzz(bytecode: string): string {
  // The actual deployed bytecode always differs because of the BZZ prefix
  // https://www.shawntabrizi.com/ethereum/verify-ethereum-contracts-using-web3-js-and-solc/
  return bytecode.split('a265627a7a72315820')[0]
}
