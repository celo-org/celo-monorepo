import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'
import { Validators } from '../generated/contracts'
import { Address, compareBN, eqAddress, NULL_ADDRESS, zip } from '../utils/helpers'
import { BondedDepositAdapter } from './bonded-deposit'

import BN = require('bn.js')

export interface Validator {
  address: Address
  id: string
  name: string
  url: string
  publicKey: string
  affiliation: string | null
}

export interface ValidatorGroup {
  address: Address
  id: string
  name: string
  url: string
  members: Address[]
}

export interface ValidatorGroupVote {
  address: Address
  votes: BN
}

export class ValidatorsAdapter {
  public contractPromise: ReturnType<typeof Validators>

  constructor(private web3: Web3, private from?: Address) {
    this.contractPromise = Validators(this.web3, from)
  }

  contract() {
    return this.contractPromise
  }

  async getRegisteredValidators(): Promise<Validator[]> {
    const contract = await this.contract()
    const vgAddresses = await contract.methods.getRegisteredValidators().call()

    return Promise.all(vgAddresses.map((addr) => this.getValidator(addr)))
  }

  async getValidator(address: Address): Promise<Validator> {
    const contract = await this.contract()
    const res = await contract.methods.getValidator(address).call()
    return {
      address,
      id: res[0],
      name: res[1],
      url: res[2],
      publicKey: res[3] as any,
      affiliation: res[4],
    }
  }

  async getRegisteredValidatorGroups(): Promise<ValidatorGroup[]> {
    const contract = await this.contract()
    const vgAddresses = await contract.methods.getRegisteredValidatorGroups().call()
    return Promise.all(vgAddresses.map((addr) => this.getValidatorGroup(addr)))
  }

  async getValidatorGroup(address: Address): Promise<ValidatorGroup> {
    const contract = await this.contract()
    const res = await contract.methods.getValidatorGroup(address).call()
    return { address, id: res[0], name: res[1], url: res[2], members: res[3] }
  }

  async getValidatorGroupsVotes(): Promise<ValidatorGroupVote[]> {
    const contract = await this.contract()
    const vgAddresses = await contract.methods.getRegisteredValidatorGroups().call()
    const res = await contract.methods.getValidatorGroupVotes().call()
    const r = zip((a, b) => ({ address: a, votes: Web3.utils.toBN(b) }), res[0], res[1])
    for (const vgAddress of vgAddresses) {
      if (!res[0].includes(vgAddress)) {
        r.push({ address: vgAddress, votes: Web3.utils.toBN(0) })
      }
    }
    return r
  }

  async getVoteFrom(validatorAddress: Address): Promise<Address | null> {
    const contract = await this.contract()
    return contract.methods.voters(validatorAddress).call()
  }

  async revokeVote(): Promise<TransactionObject<boolean>> {
    if (this.from == null) {
      throw new Error(`missing from at new ValdidatorUtils()`)
    }

    const votingDetails = await new BondedDepositAdapter(this.web3).getVotingDetails(this.from)
    const votedGroup = await this.getVoteFrom(votingDetails.accountAddress)

    if (votedGroup == null) {
      throw new Error(`Not current vote for ${this.from}`)
    }

    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(
      votedGroup,
      votingDetails.weight.neg()
    )

    const contract = await this.contract()
    return contract.methods.revokeVote(lesser, greater)
  }

  async vote(validatorGroup: Address): Promise<TransactionObject<boolean>> {
    if (this.from == null) {
      throw new Error(`missing from at new ValdidatorUtils()`)
    }

    const votingDetails = await new BondedDepositAdapter(this.web3).getVotingDetails(this.from)

    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(
      validatorGroup,
      votingDetails.weight
    )

    const contract = await this.contract()
    return contract.methods.vote(validatorGroup, lesser, greater)
  }

  private async findLesserAndGreaterAfterVote(
    votedGroup: Address,
    voteWeight: BN
  ): Promise<{ lesser: Address; greater: Address }> {
    const currentVotes = await this.getValidatorGroupsVotes()

    const selectedGroup = currentVotes.find((cv) => eqAddress(cv.address, votedGroup))

    // modify the list
    if (selectedGroup) {
      selectedGroup.votes = selectedGroup.votes.add(voteWeight)
    } else {
      currentVotes.push({
        address: votedGroup,
        votes: voteWeight,
      })
    }

    // re-sort
    currentVotes.sort((a, b) => compareBN(a.votes, b.votes))

    // find new index
    const newIdx = currentVotes.findIndex((cv) => eqAddress(cv.address, votedGroup))

    return {
      lesser: newIdx === 0 ? NULL_ADDRESS : currentVotes[newIdx - 1].address,
      greater: newIdx === currentVotes.length - 1 ? NULL_ADDRESS : currentVotes[newIdx + 1].address,
    }
  }
}
