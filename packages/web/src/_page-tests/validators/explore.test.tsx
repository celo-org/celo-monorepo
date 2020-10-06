import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import ValidatorsList from 'src/dev/ValidatorsList'

const mock = {
  data: {
    celoValidatorGroups: [
      {
        account: {
          address: '0xbcff1270b8aa83232b6d7113144557dfac93b591',
          lockedGold: '92307692307692307692295',
          name: 'Test 1',
          usd: '0',
          claims: {
            edges: [],
          },
        },
        accumulatedActive: '0',
        accumulatedRewards: '0',
        affiliates: {
          edges: [],
        },
        commission: '100000000000000000000000',
        numMembers: 5,
        receivableVotes: '2403120662644486200006987',
        rewardsRatio: '0',
        votes: '0',
      },
      {
        account: {
          address: '0x4f584db9ec38df930185df315d941d42b3186b9f',
          lockedGold: '10000000000000000000000',
          name: 'Test 2',
          usd: '0',
          claims: {
            edges: [],
          },
        },
        accumulatedActive: '0',
        accumulatedRewards: '0',
        affiliates: {
          edges: [],
        },
        commission: '100000000000000000000000',
        numMembers: 0,
        receivableVotes: '400520110440747700001165',
        rewardsRatio: '0',
        votes: '20000000000000000000000',
      },
      {
        account: {
          address: '0x57b191f75159f861bae27099391dfae88564b737',
          lockedGold: '12037845136552068543873',
          name: 'Test 3',
          usd: '30061005205326568149',
          claims: {
            edges: [],
          },
        },
        accumulatedActive: '0',
        accumulatedRewards: '0',
        affiliates: {
          edges: [
            {
              node: {
                account: {
                  claims: {
                    edges: [],
                  },
                },
                address: '0x811957bf6250975420c9444a4dd4c8a23b20239f',
                attestationsFulfilled: 0,
                attestationsRequested: 0,
                lastElected: 66228,
                lastOnline: 66228,
                lockedGold: '12037845136552068543873',
                name: 'Test 3.1',
                score: '343900000000000000000000',
                usd: '270549046847939113353',
              },
            },
          ],
        },
        commission: '100000000000000000000000',
        numMembers: 0,
        receivableVotes: '400520110440747700001165',
        rewardsRatio: '0',
        votes: '24075690273104137087747',
      },
      {
        account: {
          address: '0x7a914a1b9a025eca6a2c06936c94101184741ea2',
          lockedGold: '380209671128494378809487',
          name: 'Test 4',
          usd: '79877906214266341706',
          claims: {
            edges: [],
          },
        },
        accumulatedActive: '4153787989110478975760062',
        accumulatedRewards: '3108266363620940783415',
        affiliates: {
          edges: [],
        },
        commission: '500000000000000000000000',
        numMembers: 0,
        receivableVotes: '400520110440747700001165',
        rewardsRatio: '0.02244890474744643780',
        votes: '380209671128494378809489',
      },
      {
        account: {
          address: '0x44e11b8eb591a5b8b0cf4db6b02ad60e6ed89a62',
          lockedGold: '9987849076990425000001',
          name: 'Test 5',
          usd: '3225648078256849315',
          claims: {
            edges: [],
          },
        },
        accumulatedActive: '81693033207827672895330',
        accumulatedRewards: '15698153980849999999',
        affiliates: {
          edges: [],
        },
        commission: '100000000000000000000000',
        numMembers: 0,
        receivableVotes: '400520110440747700001165',
        rewardsRatio: '0.00576480760883750580',
        votes: '19975698153980850000002',
      },
      {
        account: {
          address: '0x439d4647515c2007aa916453e7c1105462e19f50',
          lockedGold: '10000000000000000000000',
          name: 'Test 6',
          usd: '0',
          claims: {
            edges: [],
          },
        },
        accumulatedActive: '368243202620000365202335',
        accumulatedRewards: '0',
        affiliates: {
          edges: [],
        },
        commission: '100000000000000000000000',
        numMembers: 1,
        receivableVotes: '801040220881495400002329',
        rewardsRatio: '0E-40',
        votes: '44374584605704383762956',
      },
    ],
    latestBlock: 10000,
  },
}

describe('ValidatorsList', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <ValidatorsList data={mock.data} />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
