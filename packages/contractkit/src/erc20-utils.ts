import { GoldToken as GoldTokenType } from '@celo/contractkit/types/GoldToken'
import { IERC20Token as TokenType } from '@celo/contractkit/types/IERC20Token'
import { StableToken as StableTokenType } from '@celo/contractkit/types/StableToken'
import { BigNumber } from 'bignumber.js'
import { sendTransaction } from './contract-utils'
import { getGoldTokenContract } from './contracts'
// Write out the full number in "toString()"
BigNumber.config({ EXPONENTIAL_AT: 1e9 })
const tag = 'erc20-utils'

export type CeloTokenType = GoldTokenType | StableTokenType
type TransferableWithCommentTokenType = CeloTokenType

export async function getErc20Balance(contract: TokenType, address: string, web3: any) {
  const balance = await balanceOf(contract, address, web3)
  // TODO(asa): Add decimals to IERC20Token interface
  // @ts-ignore
  const decimals = await contract.methods.decimals().call()
  // @ts-ignore
  const one = new BigNumber(10).pow(decimals)
  return new BigNumber(balance).div(one)
}

// TODO(asa): Figure out why GoldToken.balanceOf() returns 2^256 - 1
export async function balanceOf(contract: TokenType, address: string, web3: any) {
  if (contract.options.address === (await getGoldTokenAddress(web3))) {
    return new BigNumber(await web3.eth.getBalance(address))
  } else {
    return new BigNumber(await contract.methods.balanceOf(address).call())
  }
}

export async function convertToContractDecimals(value: number | BigNumber, contract: TokenType) {
  // @ts-ignore
  const decimals = new BigNumber(await contract.methods.decimals().call())
  const one = new BigNumber(10).pow(decimals.toNumber())
  return one.times(value)
}

export async function parseFromContractDecimals(value: BigNumber, contract: TokenType) {
  // @ts-ignore
  const decimals = new BigNumber(await contract.methods.decimals().call())
  const one = new BigNumber(10).pow(decimals.toNumber())
  return value.div(one)
}

export async function selectTokenContractByIdentifier(contracts: TokenType[], identifier: string) {
  const identifiers = await Promise.all(
    // @ts-ignore
    contracts.map((contract) => contract.methods.symbol().call())
  )
  const index = identifiers.indexOf(identifier)
  return contracts[index]
}

export async function approveToken(
  token: TokenType,
  address: string,
  approveAmount: BigNumber,
  txOptions = {}
) {
  const tx = token.methods.approve(address, approveAmount.toString())
  return sendTransaction(tag, 'approve token', tx, txOptions)
}

export async function allowance(
  token: TokenType,
  owner: string,
  spender: string
): Promise<BigNumber> {
  return new BigNumber(await token.methods.allowance(owner, spender).call())
}

export async function transferToken(
  toAddress: string,
  token: TokenType,
  amount: BigNumber,
  txOptions = {}
) {
  const tx = token.methods.transfer(toAddress, amount.toString())
  return sendTransaction(tag, 'transfer token', tx, txOptions)
}

export async function transferTokenWithComment(
  toAddress: string,
  token: TransferableWithCommentTokenType,
  amount: BigNumber,
  comment: string,
  txOptions = {}
) {
  const tx = token.methods.transferWithComment(toAddress, amount.toString(), comment)
  return sendTransaction(tag, 'transfer token with comment', tx, txOptions)
}

// exported for testing
export async function getGoldTokenAddress(web3: any): Promise<string> {
  const goldToken: GoldTokenType = await getGoldTokenContract(web3)
  return goldToken._address
}
