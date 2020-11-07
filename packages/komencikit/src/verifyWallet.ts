import { Address, normalizeAddress } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { GET_IMPLEMENTATION_ABI } from '@celo/contractkit/lib/governance/proxy'
import { soliditySha3 } from 'web3-utils'
import {
  InvalidBytecode,
  InvalidImplementation,
  InvalidSigner,
  WalletValidationError,
} from './errors'

/*
 * It is highly unlikely (but not impossible) that we will ever need
 * to use a new proxy implementation for the MTW, therefore we're
 * using this static SHA3 of the stripped bytecode to verify integrity.
 * If this ever needs to change it will be part of a bigger effort.
 *
 * See: `scripts/proxy-bytecode-sha3.js` or run `yarn proxy:sha3`
 */
const PROXY_BYTECODE_SHA3 = '0x69f56de93d0b1eb15364c67a2756afbc0b3112e544f64c4bf2c7bcdf287f0a91'

export const verifyWallet = async (
  contractKit: ContractKit,
  walletAddress: Address,
  allowedImplementations: Address[],
  expectedSigner: Address
): Promise<Result<true, WalletValidationError>> => {
  const code = await contractKit.web3.eth.getCode(walletAddress)

  if (soliditySha3(stripBzz(code)) !== PROXY_BYTECODE_SHA3) {
    return Err(new InvalidBytecode(walletAddress))
  }

  const actualImplementationRaw = await contractKit.web3.eth.call({
    to: walletAddress,
    data: GET_IMPLEMENTATION_ABI.signature,
  })
  const actualImplementation = normalizeAddress(
    // XXX: This is a typing issue in web3js :(
    (contractKit.web3.eth.abi.decodeParameter(
      'address',
      actualImplementationRaw
    ) as unknown) as string
  )
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
