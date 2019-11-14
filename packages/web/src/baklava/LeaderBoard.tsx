import ApolloClient from 'apollo-boost'
import { InMemoryCache } from 'apollo-cache-inmemory'
import getenv from 'getenv'
import gql from 'graphql-tag'
import fetch from 'node-fetch'
import * as React from 'react'
import { ApolloProvider, Query } from 'react-apollo'
import LeaderBoardError from 'src/baklava/LeaderBoardError'
import LeaderBoardLoading from 'src/baklava/LeaderBoardLoading'
import LeaderBoardView from 'src/baklava/LeaderBoardView'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'

// TODO: check how to load this URL from env
const graphqlURI = getenv('REACT_APP_WS_GRAPHQL', 'http://localhost:8080/v1/graphql')

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

const createApolloClient = () => {
  return new ApolloClient({
    uri: graphqlURI,
    cache: new InMemoryCache(),
    fetch,
  })
}

class LeaderBoard extends React.PureComponent<I18nProps> {
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
            return <LeaderBoardView data={data} />
          }}
        </Query>
      </ApolloProvider>
    )
  }
}

export default withNamespaces(NameSpaces.baklava)(LeaderBoard)
