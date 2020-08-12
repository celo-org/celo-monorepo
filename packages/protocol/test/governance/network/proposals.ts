import { assertEqualBN } from '@celo/protocol/lib/test-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import { ProposalsTestContract, ProposalsTestInstance } from 'types'

const ProposalsTest: ProposalsTestContract = artifacts.require('ProposalsTest')

// @ts-ignore
// TODO(mcortesi): Use BN
ProposalsTest.numberFormat = 'BigNumber'

contract('ProposalsTest', () => {
  let proposalsTest: ProposalsTestInstance

  describe('#getSupportWithQuorumPadding()', () => {
    const networkWeight = 100
    const quorum = toFixed(5 / 10)

    beforeEach(async () => {
      proposalsTest = await ProposalsTest.new()
      await proposalsTest.setNetworkWeight(networkWeight)
    })

    it('should return support ratio when participation above critical baseline', async () => {
      const yes = 15
      const no = 10
      const abstain = 30
      const expected = toFixed(yes / (yes + no))
      await proposalsTest.setVotes(yes, no, abstain)
      const support = await proposalsTest.getSupportWithQuorumPadding(quorum)
      assertEqualBN(support, expected)
    })

    it('should return lowered support ratio when participation below critical baseline', async () => {
      const yes = 15
      const no = 10
      const abstain = 10
      // 15 "no" votes added to reach quorum of 50 votes (50% baseline * 100 network weight)
      const addedNo = 50 - yes - no - abstain
      const expected = toFixed(yes / (yes + no + addedNo))
      await proposalsTest.setVotes(yes, no, abstain)
      const support = await proposalsTest.getSupportWithQuorumPadding(quorum)
      assertEqualBN(support, expected)
    })

    it('should return 0 support ratio when 0 yes votes and 0 no votes are cast', async () => {
      const yes = 0
      const no = 0
      const abstain = 30
      const expected = toFixed(0)
      await proposalsTest.setVotes(yes, no, abstain)
      const support = await proposalsTest.getSupportWithQuorumPadding(quorum)
      assertEqualBN(support, expected)
    })
  })
})
