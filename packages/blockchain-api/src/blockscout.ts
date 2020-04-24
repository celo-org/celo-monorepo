import { RESTDataSource } from 'apollo-datasource-rest'
import BigNumber from 'bignumber.js'
import { BLOCKSCOUT_API, FAUCET_ADDRESS, VERIFICATION_REWARDS_ADDRESS } from './config'
import { EventArgs, EventTypes, TokenTransactionArgs, TransferEvent } from './schema'
import { formatCommentString, getContractAddresses } from './utils'

// to get rid of 18 extra 0s in the values
const WEI_PER_GOLD = Math.pow(10, 18)

export interface BlockscoutTransferTx {
  blockNumber: number
  transactionHash: string
  timestamp: string
  gasPrice: string
  gasUsed: string
  feeToken: string
  gatewayFee: string
  gatewayFeeRecipient: string
  input: string
  celoTransfers: BlockscoutCeloTransfer[]
}

export interface BlockscoutCeloTransfer {
  fromAddressHash: string
  toAddressHash: string
  token: string
  value: string
}

export class BlockscoutAPI extends RESTDataSource {
  attestationsAddress: string | undefined
  escrowAddress: string | undefined

  constructor() {
    super()
    this.baseURL = BLOCKSCOUT_API
  }

  // Find transfers which are unrelated to the fees.
  // We take advantage of the following property:
  // the fees are always the last transfers
  // This is only valid for transactions paying for fees in a token
  // different from the utility token (cGLD)
  getTransfersUnrelatedToFees(transferTx: BlockscoutTransferTx) {
    const { celoTransfers } = transferTx

    const transfersCount = celoTransfers.length
    // 3 fee transfers when gatewayFeeRecipient is set, otherwise 2
    const expectedFeeTransfersCount = transferTx.gatewayFeeRecipient ? 3 : 2

    if (transfersCount < expectedFeeTransfersCount) {
      throw new Error(`Cannot determine fee transfers for tx ${transferTx.transactionHash}`)
    }

    let totalFee = new BigNumber(0)
    for (let i = 1; i <= expectedFeeTransfersCount; i++) {
      const feeTransfer = celoTransfers[transfersCount - i]
      totalFee = totalFee.plus(feeTransfer.value)
    }

    const gasFee = new BigNumber(transferTx.gasUsed).multipliedBy(transferTx.gasPrice)
    const gatewayFee = new BigNumber(transferTx.gatewayFee || 0)
    const expectedTotalFee = gasFee.plus(gatewayFee)

    // Make sure our assertion is correct
    if (!totalFee.isEqualTo(expectedTotalFee)) {
      // If this is raised, something is wrong with our assertion
      throw new Error(`Fee transfers don't add up for tx ${transferTx.transactionHash}`)
    }

    // Filter out fee transfers
    return celoTransfers.slice(0, transfersCount - expectedFeeTransfersCount)
  }

  getRelevantTransfers(
    transferTx: BlockscoutTransferTx,
    address: string
  ): BlockscoutCeloTransfer[] {
    const { feeToken, celoTransfers } = transferTx

    let transfers = celoTransfers
    if (feeToken && feeToken !== 'cGLD') {
      // When fees are NOT paid in the utility token (cGLD)
      // the transfers contain fee transfers
      transfers = this.getTransfersUnrelatedToFees(transferTx)
    }

    // Filter out transfers unrelated to the queried address
    return transfers.filter(
      (transfer) =>
        transfer.fromAddressHash.toLowerCase() === address ||
        transfer.toAddressHash.toLowerCase() === address
    )
  }

  async getRawTokenTransactions(args: EventArgs): Promise<BlockscoutTransferTx[]> {
    console.info('Getting token transactions', args)

    const address = args.address.toLowerCase()

    const response = await this.post('', {
      query: `
        query Transfers($address: String!) {
          # TXs related to cUSD or cGLD transfers
          transferTxs(addressHash: $address, first: 100) {
            edges {
              node {
                transactionHash
                blockNumber
                timestamp
                gasPrice
                gasUsed
                feeToken
                gatewayFee
                gatewayFeeRecipient
                input
                # Transfers associated with the TX
                celoTransfer(first: 10) {
                  edges {
                    node {
                      fromAddressHash
                      toAddressHash
                      value
                      token
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: { address },
    })

    const transferTxs = response.data.transferTxs.edges.map(({ node }: any) => {
      const { celoTransfer, ...partialTransferTx } = node
      const celoTransfers = node.celoTransfer.edges.map((edge: any) => edge.node)
      const transferTx = { ...partialTransferTx, celoTransfers }

      return {
        ...transferTx,
        celoTransfers: this.getRelevantTransfers(transferTx, address),
      }
    })

    return transferTxs
  }

  async ensureTokenAddresses() {
    if (this.attestationsAddress && this.escrowAddress) {
      // Already got addresses
      return
    } else {
      const addresses = await getContractAddresses()
      this.attestationsAddress = addresses.attestationsAddress
      this.escrowAddress = addresses.escrowAddress
    }
  }

  getAttestationAddress() {
    if (this.attestationsAddress) {
      return this.attestationsAddress
    } else {
      throw new Error('Cannot find attestation address')
    }
  }

  getEscrowAddress() {
    if (this.escrowAddress) {
      return this.escrowAddress
    } else {
      throw new Error('Cannot find escrow address')
    }
  }

  async getFeedRewards(args: EventArgs) {
    const rewards: TransferEvent[] = []
    const rawTransferTxs = await this.getRawTokenTransactions(args)
    const userAddress = args.address.toLowerCase()
    await this.ensureTokenAddresses()

    const tokenToSymbol: any = {
      cGLD: 'Celo Gold',
      cUSD: 'Celo Dollar',
    }
    for (const transferTx of rawTransferTxs) {
      // Only include verification rewards transfers
      const rewardTransfer = transferTx.celoTransfers.find(
        (transfer) =>
          transfer.fromAddressHash.toLowerCase() === VERIFICATION_REWARDS_ADDRESS &&
          transfer.toAddressHash.toLowerCase() === userAddress
      )
      if (!rewardTransfer) {
        continue
      }
      rewards.push({
        type: EventTypes.VERIFICATION_REWARD,
        timestamp: this.getTransactionTimestamp(transferTx),
        block: new BigNumber(transferTx.blockNumber).toNumber(),
        value: new BigNumber(rewardTransfer.value).dividedBy(WEI_PER_GOLD).toNumber(),
        address: VERIFICATION_REWARDS_ADDRESS,
        comment: transferTx.input ? formatCommentString(transferTx.input) : '',
        symbol: tokenToSymbol[rewardTransfer.token],
        hash: transferTx.transactionHash,
      })
    }
    console.info(
      `[Celo] getFeedRewards address=${args.address} startblock=${args.startblock} endblock=${args.endblock} rawTransactionCount=${rawTransferTxs.length} rewardsCount=${rewards.length}`
    )
    return rewards.sort((a, b) => b.timestamp - a.timestamp)
  }

  getTransactionBlock(transferTx: BlockscoutTransferTx) {
    return new BigNumber(transferTx.blockNumber).toFixed()
  }

  getTransactionTimestamp(transferTx: BlockscoutTransferTx) {
    return new Date(transferTx.timestamp).getTime()
  }

  getRegularTokenTransaction(
    userAddress: string,
    transferTx: BlockscoutTransferTx,
    transfer: BlockscoutCeloTransfer
  ) {
    const hash = transferTx.transactionHash
    const block = this.getTransactionBlock(transferTx)
    const timestamp = this.getTransactionTimestamp(transferTx)
    const comment = transferTx.input ? formatCommentString(transferTx.input) : ''
    const eventToAddress = transfer.toAddressHash.toLowerCase()
    const eventFromAddress = transfer.fromAddressHash.toLowerCase()
    const [type, address] = resolveTransferEventType(
      userAddress,
      eventToAddress,
      eventFromAddress,
      this.getAttestationAddress(),
      this.getEscrowAddress()
    )

    return {
      type,
      timestamp,
      block,
      amount: {
        // Signed amount relative to the account currency
        value: new BigNumber(transfer.value)
          .multipliedBy(eventFromAddress === userAddress ? -1 : 1)
          .dividedBy(WEI_PER_GOLD)
          .toString(),
        currencyCode: transfer.token,
        timestamp,
      },
      address,
      comment,
      hash,
    }
  }

  getExchangeTransaction(
    userAddress: string,
    token: string,
    transferTx: BlockscoutTransferTx,
    transfers: BlockscoutCeloTransfer[]
  ) {
    const hash = transferTx.transactionHash
    const block = this.getTransactionBlock(transferTx)
    const timestamp = this.getTransactionTimestamp(transferTx)
    let inTransfer: BlockscoutCeloTransfer, outTransfer: BlockscoutCeloTransfer
    if (transfers[0].fromAddressHash.toLowerCase() === userAddress) {
      inTransfer = transfers[0]
      outTransfer = transfers[1]
    } else {
      inTransfer = transfers[1]
      outTransfer = transfers[0]
    }
    // Find the transfer related to the queried token
    const tokenTransfer = [inTransfer, outTransfer].find((event) => event.token === token)
    if (!tokenTransfer) {
      return undefined
    }

    return {
      type: EventTypes.EXCHANGE,
      timestamp,
      block,
      amount: {
        // Signed amount relative to the account currency
        value: new BigNumber(tokenTransfer.value)
          .multipliedBy(tokenTransfer === inTransfer ? -1 : 1)
          .dividedBy(WEI_PER_GOLD)
          .toString(),
        currencyCode: tokenTransfer.token,
        timestamp,
      },
      makerAmount: {
        value: new BigNumber(inTransfer.value).dividedBy(WEI_PER_GOLD).toString(),
        currencyCode: inTransfer.token,
        timestamp,
      },
      takerAmount: {
        value: new BigNumber(outTransfer.value).dividedBy(WEI_PER_GOLD).toString(),
        currencyCode: outTransfer.token,
        timestamp,
      },
      hash,
    }
  }

  async getTokenTransactions(args: TokenTransactionArgs) {
    const rawTransferTxs = await this.getRawTokenTransactions(args)
    const events: any[] = []
    const userAddress = args.address.toLowerCase()
    const token = args.token

    await this.ensureTokenAddresses()

    // Generate final events
    rawTransferTxs.forEach((transferTx) => {
      const transfers = transferTx.celoTransfers

      switch (transfers.length) {
        case 0: // Just a contract call
          break

        case 1: // It's a regular token transfer
          events.push(this.getRegularTokenTransaction(userAddress, transferTx, transfers[0]))
          break

        case 2: // Exchange events have two corresponding transfers (in and out)
          const exchangeTransaction = this.getExchangeTransaction(
            userAddress,
            token,
            transferTx,
            transfers
          )
          if (exchangeTransaction) {
            events.push(exchangeTransaction)
          }
          break

        default:
          // Error if anything else happens
          console.error(`Unhandled transfers for tx ${transferTx.transactionHash}`)
          break
      }
    })

    console.info(
      `[Celo] getTokenTransactions address=${args.address} token=${token} localCurrencyCode=${args.localCurrencyCode}} rawTransactionCount=${rawTransferTxs.length} eventCount=${events.length}`
    )
    return events
      .filter((event) => event.amount.currencyCode === token)
      .sort((a, b) => b.timestamp - a.timestamp)
  }
}

function resolveTransferEventType(
  userAddress: string,
  eventToAddress: string,
  eventFromAddress: string,
  attestationsAddress: string,
  escrowAddress: string
): [EventTypes, string] {
  if (eventToAddress === userAddress && eventFromAddress === FAUCET_ADDRESS) {
    return [EventTypes.FAUCET, FAUCET_ADDRESS]
  }
  if (eventToAddress === attestationsAddress && eventFromAddress === userAddress) {
    return [EventTypes.VERIFICATION_FEE, attestationsAddress]
  }
  if (eventToAddress === userAddress && eventFromAddress === VERIFICATION_REWARDS_ADDRESS) {
    return [EventTypes.VERIFICATION_REWARD, VERIFICATION_REWARDS_ADDRESS]
  }
  if (eventToAddress === userAddress && eventFromAddress === escrowAddress) {
    return [EventTypes.ESCROW_RECEIVED, eventFromAddress]
  }
  if (eventToAddress === userAddress) {
    return [EventTypes.RECEIVED, eventFromAddress]
  }
  if (eventFromAddress === userAddress && eventToAddress === escrowAddress) {
    return [EventTypes.ESCROW_SENT, eventToAddress]
  }
  if (eventFromAddress === userAddress) {
    return [EventTypes.SENT, eventToAddress]
  }
  throw new Error('No valid event type found ')
}
