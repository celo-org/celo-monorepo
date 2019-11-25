import ApolloClient from 'apollo-boost'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'cross-fetch'
import gql from 'graphql-tag'
import getConfig from 'next/config'
import * as React from 'react'
import { ApolloProvider, Query } from 'react-apollo'
import LeaderBoard from 'src/dev/LeaderBoard'
import LeaderBoardError from 'src/dev/LeaderBoardError'
import LeaderBoardLoading from 'src/dev/LeaderBoardLoading'
import { I18nProps, withNamespaces } from 'src/i18n'

const LEADERS = [
  { points: 8, identity: 'Rex' },
  { points: 840, identity: '100%_that_validator_who_is_an_absolute_diva' },
  { points: 3200, identity: 'Heisenberg' },

  { points: 7600, identity: 'DX-West' },
  { points: 5000, identity: 'Simone2148' },
  { points: 4009, identity: '$celo-$' },
  { points: 1002, identity: '77zepher' },
  { points: 9400, identity: 'Gatsby & Durben' },
]
/* tslint:disable-next-line */
console.log(LEADERS)

const graphqlURI = getConfig().publicRuntimeConfig.LEADERBOARD.uri

const createApolloClient = () => {
  return new ApolloClient({
    uri: graphqlURI,
    cache: new InMemoryCache(),
    fetch,
  })
}

// TODO (@diminator): change once leaderboard endpoint is ready
const query = gql`
  query AddresessOrderedByBalance {
    addresses(
      where: { fetched_coin_balance: { _gt: "0" } }
      order_by: { fetched_coin_balance: desc }
    ) {
      fetched_coin_balance
      hash
    }
  }
`

class LeaderBoardApp extends React.PureComponent<I18nProps> {
  render() {
    return (
      <ApolloProvider client={createApolloClient()}>
        <Query query={query}>
          {({ loading, error, data }) => {
            if (loading) {
              return <LeaderBoardLoading />
            }
            if (error) {
              return <LeaderBoardError error={error} />
            }
            // TODO (@diminator): change once leaderboard endpoint is ready
            const LEADERS = data.addresses.map((account) => {
              return {
                identity: account.hash,
                points: account.fetched_coin_balance,
              }
            })
            return <LeaderBoard leaders={LEADERS} />
          }}
        </Query>
      </ApolloProvider>
    )
  }
}

export default withNamespaces('dev')(LeaderBoardApp)
