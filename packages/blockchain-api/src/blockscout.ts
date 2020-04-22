import { RESTDataSource } from 'apollo-datasource-rest'
import BigNumber from 'bignumber.js'
import { BLOCKSCOUT_API, FAUCET_ADDRESS, VERIFICATION_REWARDS_ADDRESS } from './config'
import { EventArgs, EventTypes, TokenTransactionArgs, TransferEvent } from './schema'
import { formatCommentString, getContractAddresses } from './utils'

// to get rid of 18 extra 0s in the values
const WEI_PER_GOLD = Math.pow(10, 18)

export interface BlockscoutTransaction {
  value: string
  txreceipt_status: string
  transactionIndex: string
  tokenSymbol: string
  tokenName: string
  tokenDecimal: string
  to: string
  timeStamp: string
  nonce: string
  isError: string
  input: string
  hash: string
  gasUsed: string
  gasPrice: string
  gas: string
  from: string
  cumulativeGasUsed: string
  contractAddress: string
  confirmations: string
  blockNumber: string
  blockHash: string
}

export interface BlockscoutTransferTx {
  blockNumber: number
  transactionHash: string
  timestamp: string
  gasPrice: string
  gasUsed: string
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
  tokenAddressMapping: { [key: string]: string } | undefined
  attestationsAddress: string | undefined
  escrowAddress: string | undefined
  goldTokenAddress: string | undefined
  stableTokenAddress: string | undefined
  constructor() {
    super()
    this.baseURL = BLOCKSCOUT_API
  }

  async getRawTokenTransactions(args: EventArgs): Promise<BlockscoutTransferTx[]> {
    console.info('Getting token transactions', args)

    const response = await this.post('', {
      query: `
        query CeloTransfers($address: String!) {
          # TXs related to cUSD or cGLD transfers
          transferTxs(addressHash: $address, first: 100) {
            edges {
              node {
                transactionHash
                blockNumber
                timestamp
                gasPrice
                gasUsed
                input
                # Transfer associated with the TX
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
      variables: { address: args.address },
    })

    const transferTxs = response.data.transferTxs.edges.map(({ node }: any) => {
      const { celoTransfer, ...transferTx } = node
      const celoTransfers = node.celoTransfer.edges.map((edge: any) => edge.node)

      return { ...transferTx, celoTransfers }
    })

    return transferTxs
  }

  async ensureTokenAddresses() {
    if (
      this.tokenAddressMapping &&
      this.attestationsAddress &&
      this.escrowAddress &&
      this.goldTokenAddress &&
      this.stableTokenAddress
    ) {
      // Already got addresses
      return
    } else {
      const addresses = await getContractAddresses()
      this.attestationsAddress = addresses.attestationsAddress
      this.tokenAddressMapping = addresses.tokenAddressMapping
      this.escrowAddress = addresses.escrowAddress
      this.goldTokenAddress = addresses.goldTokenAddress
      this.stableTokenAddress = addresses.stableTokenAddress
    }
  }

  getTokenAtAddress(tokenAddress: string) {
    if (this.tokenAddressMapping) {
      const lowerCaseTokenAddress = tokenAddress.toLowerCase()
      if (lowerCaseTokenAddress in this.tokenAddressMapping) {
        return this.tokenAddressMapping[lowerCaseTokenAddress]
      } else {
        console.info('Token addresses mapping: ' + JSON.stringify(this.tokenAddressMapping))
        throw new Error(
          'No token corresponding to ' +
            lowerCaseTokenAddress +
            '. Check web3 provider is for correct network.'
        )
      }
    } else {
      throw new Error('Cannot find tokenAddressMapping')
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
        timestamp: new Date(transferTx.timestamp).getTime(),
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

  async getTokenTransactions(args: TokenTransactionArgs) {
    const rawTransferTxs = await this.getRawTokenTransactions(args)
    const events: any[] = []
    const userAddress = args.address.toLowerCase()

    await this.ensureTokenAddresses()

    // Generate final events
    rawTransferTxs.forEach((transferTx) => {
      const { celoTransfers } = transferTx

      // Find transfers which are the fee.
      // We take advantage of the following property:
      // the fees are always the last transfers
      const transfersCount = celoTransfers.length
      if (transfersCount <= 2) {
        return
      }

      const feeTransfer1 = celoTransfers[transfersCount - 1]
      const feeTransfer2 = celoTransfers[transfersCount - 2]
      const fee1Value = new BigNumber(feeTransfer1.value)
      const fee2Value = new BigNumber(feeTransfer2.value)
      const gasValue = new BigNumber(transferTx.gasUsed).multipliedBy(
        new BigNumber(transferTx.gasPrice)
      )

      // Make sure our assertion is correct
      if (!fee1Value.plus(fee2Value).isEqualTo(gasValue)) {
        throw new Error('Cannot determine fee transfers')
      }

      const transfers = celoTransfers
        .slice(0, transfersCount - 2)
        .filter(
          (transfer) =>
            transfer.fromAddressHash.toLowerCase() === userAddress ||
            transfer.toAddressHash.toLowerCase() === userAddress
        )

      const block = transferTx.blockNumber
      const hash = transferTx.transactionHash
      const timestamp = new Date(transferTx.timestamp).getTime()

      // Exchange events have two corresponding transfers (in and out)
      if (transfers.length === 2) {
        let inTransfer: BlockscoutCeloTransfer, outTransfer: BlockscoutCeloTransfer
        if (transfers[0].fromAddressHash.toLowerCase() === userAddress) {
          inTransfer = transfers[0]
          outTransfer = transfers[1]
        } else {
          inTransfer = transfers[1]
          outTransfer = transfers[0]
        }
        // Find the transfer related to the queried token
        const tokenTransfer = [inTransfer, outTransfer].find((event) => event.token === args.token)
        if (tokenTransfer) {
          events.push({
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
          })
        }
        // Otherwise, it's a regular token transfer
      } else {
        const celoTransfer = transfers[0]

        const comment = transferTx.input ? formatCommentString(transferTx.input) : ''
        const eventToAddress = celoTransfer.toAddressHash.toLowerCase()
        const eventFromAddress = celoTransfer.fromAddressHash.toLowerCase()
        const [type, address] = resolveTransferEventType(
          userAddress,
          eventToAddress,
          eventFromAddress,
          this.getAttestationAddress(),
          this.getEscrowAddress()
        )
        events.push({
          type,
          timestamp,
          block,
          amount: {
            // Signed amount relative to the account currency
            value: new BigNumber(celoTransfer.value)
              .multipliedBy(eventFromAddress === userAddress ? -1 : 1)
              .dividedBy(WEI_PER_GOLD)
              .toString(),
            currencyCode: celoTransfer.token,
            timestamp,
          },
          address,
          comment,
          hash,
        })
      }
    })

    console.info(
      `[Celo] getTokenTransactions address=${args.address} token=${args.token} localCurrencyCode=${args.localCurrencyCode}
      } rawTransactionCount=${rawTransferTxs.length} eventCount=${events.length}`
    )
    return events
      .filter((event) => event.amount.currencyCode === args.token)
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
