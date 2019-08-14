import { eqAddress } from '@celo/utils/lib/src/address'
import { compareBN } from '@celo/utils/lib/src/bn'
import { zip } from '@celo/utils/lib/src/collections'
import { Address, NULL_ADDRESS } from 'src/base'
import { Validators } from 'src/generated/types/Validators'
import { BaseWrapper } from 'src/wrappers/BaseWrapper'
import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'

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

export class ValidatorsWrapper extends BaseWrapper<Validators> {
  async getRegisteredValidators(): Promise<Validator[]> {
    const vgAddresses = await this.contract.methods.getRegisteredValidators().call()

    return Promise.all(vgAddresses.map((addr) => this.getValidator(addr)))
  }

  async getValidator(address: Address): Promise<Validator> {
    const res = await this.contract.methods.getValidator(address).call()
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
    const vgAddresses = await this.contract.methods.getRegisteredValidatorGroups().call()
    return Promise.all(vgAddresses.map((addr) => this.getValidatorGroup(addr)))
  }

  async getValidatorGroup(address: Address): Promise<ValidatorGroup> {
    const res = await this.contract.methods.getValidatorGroup(address).call()
    return { address, id: res[0], name: res[1], url: res[2], members: res[3] }
  }

  async getValidatorGroupsVotes(): Promise<ValidatorGroupVote[]> {
    const vgAddresses = await this.contract.methods.getRegisteredValidatorGroups().call()
    const res = await this.contract.methods.getValidatorGroupVotes().call()
    const r = zip((a, b) => ({ address: a, votes: Web3.utils.toBN(b) }), res[0], res[1])
    for (const vgAddress of vgAddresses) {
      if (!res[0].includes(vgAddress)) {
        r.push({ address: vgAddress, votes: Web3.utils.toBN(0) })
      }
    }
    return r
  }

  async getVoteFrom(validatorAddress: Address): Promise<Address | null> {
    return this.contract.methods.voters(validatorAddress).call()
  }

  async revokeVote(): Promise<TransactionObject<boolean>> {
    if (this.kit.defaultAccount == null) {
      throw new Error(`missing from at new ValdidatorUtils()`)
    }

    const bondedDeposits = await this.kit.contracts.getBondedDeposits()
    const votingDetails = await bondedDeposits.getVotingDetails(this.kit.defaultAccount)
    const votedGroup = await this.getVoteFrom(votingDetails.accountAddress)

    if (votedGroup == null) {
      throw new Error(`Not current vote for ${this.kit.defaultAccount}`)
    }

    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(
      votedGroup,
      votingDetails.weight.neg()
    )

    return this.contract.methods.revokeVote(lesser, greater)
  }

  async vote(validatorGroup: Address): Promise<TransactionObject<boolean>> {
    if (this.kit.defaultAccount == null) {
      throw new Error(`missing from at new ValdidatorUtils()`)
    }

    const bondedDeposits = await this.kit.contracts.getBondedDeposits()
    const votingDetails = await bondedDeposits.getVotingDetails(this.kit.defaultAccount)

    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(
      validatorGroup,
      votingDetails.weight
    )

    return this.contract.methods.vote(validatorGroup, lesser, greater)
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
