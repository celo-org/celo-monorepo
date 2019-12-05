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

const graphqlURI = getConfig().publicRuntimeConfig.LEADERBOARD.uri

const createApolloClient = () => {
  return new ApolloClient({
    uri: graphqlURI,
    cache: new InMemoryCache(),
    fetch,
  })
}

const query = gql`
  query AddresessOrderedByBalance {
    leaderboard {
      points
      identity
      address
    }
  }
`

class LeaderBoardApp extends React.PureComponent<I18nProps> {
  render() {
    if (!getConfig().publicRuntimeConfig.FLAGS.LEADERBOARD) {
      return null
    }
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
            const leaders = data.leaderboard
            return <LeaderBoard leaders={leaders} />
          }}
        </Query>
      </ApolloProvider>
    )
  }
}

export default withNamespaces('dev')(LeaderBoardApp)
