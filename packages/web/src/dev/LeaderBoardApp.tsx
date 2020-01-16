import ApolloClient from 'apollo-boost'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'cross-fetch'
import gql from 'graphql-tag'
import getConfig from 'next/config'
import * as React from 'react'
import { ApolloProvider, Query } from 'react-apollo'
import LeaderBoard from 'src/dev/LeaderBoard'
import ShowApolloError from 'src/dev/ShowApolloError'
import { I18nProps, withNamespaces } from 'src/i18n'

function createApolloClient() {
  return new ApolloClient({
    uri: getConfig().publicRuntimeConfig.LEADERBOARD.uri,
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

const loadingLeaders = new Array(8).fill({ points: 0, identity: ' ' })

class LeaderBoardApp extends React.PureComponent<I18nProps> {
  render() {
    if (!getConfig().publicRuntimeConfig.FLAGS.LEADERBOARD) {
      return null
    }
    return (
      <ApolloProvider client={createApolloClient()}>
        <Query query={query}>
          {({ loading, error, data }) => {
            if (error) {
              return <ShowApolloError error={error} />
            }
            const leaders = loading ? loadingLeaders : data.leaderboard
            return <LeaderBoard leaders={leaders} isLoading={loading} />
          }}
        </Query>
      </ApolloProvider>
    )
  }
}

export default withNamespaces('dev')(LeaderBoardApp)
