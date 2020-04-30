import * as React from 'react'
import { MockedProvider } from 'react-apollo/test-utils'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { Activity, rewardsQuery } from 'src/components/HomeScreen/Activity'
import i18n from 'src/i18n'

const abeAddress = '0x0000000000000000000000000000000000000abe'

const mockRequest = {
  request: {
    query: rewardsQuery,
    variables: {
      address: abeAddress,
    },
  },
}

const mockWithData = [
  {
    ...mockRequest,
    result: {
      data: {
        events: [
          {
            value: '1',
            timestamp: '1545063714',
            address: abeAddress,
          },
          {
            value: '2.555',
            timestamp: '1545063714',
            address: abeAddress,
          },
        ],
      },
    },
  },
]

const mocksWithoutData = [
  {
    ...mockRequest,
    result: {
      data: {
        events: [],
      },
    },
  },
]

// @ts-ignore
Date.prototype.toLocaleString = (locale: any) => {
  return '12/17/2018, 5:21:53 PM'
}

const tProps = {
  tReady: false,
  i18n,
  t: i18n.t,
}

// TODO(Rossy): After over an hour of messing with jest, I'm giving up on this for now.
// The MockProvider in node_modules/react-apollo/test-utils.js is trying to import the apollo-client from
// node_modules/src/ApolloClient.ts which doesn't exist. I can't figure out why it won't just import it from node_modules/apollo-client
// jest mocking the client lib hasn't worked either.
describe.skip('Activity', () => {
  describe('when transactions', () => {
    it('renders activity feed', () => {
      const tree = renderer.create(
        <MockedProvider mocks={mockWithData} addTypename={false}>
          <Activity
            isVerifying={true}
            accountAddress={abeAddress}
            setTotalEarnings={jest.fn()}
            setTotalMessages={jest.fn()}
            {...tProps}
          />
        </MockedProvider>
      )
      expect(tree).toMatchSnapshot()
    })
  })

  describe('when no transactions', () => {
    describe('when verifying OFF', () => {
      it('renders empty feed', () => {
        const tree = renderer.create(
          <MockedProvider mocks={mocksWithoutData} addTypename={false}>
            <Activity
              isVerifying={false}
              accountAddress={abeAddress}
              setTotalEarnings={jest.fn()}
              setTotalMessages={jest.fn()}
              {...tProps}
            />
          </MockedProvider>
        )
        expect(tree).toMatchSnapshot()
      })
    })
  })
})
