import ApolloClient from 'apollo-boost'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'cross-fetch'
import gql from 'graphql-tag'
import getConfig from 'next/config'
import * as React from 'react'
import { ApolloProvider, Query } from 'react-apollo'
import { StyleSheet, View } from 'react-native'
import ShowApolloError from 'src/dev/ShowApolloError'
import ValidatorsList from 'src/dev/ValidatorsList'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import menuItems from 'src/shared/menu-items'
import { standardStyles } from 'src/styles'

function createApolloClient() {
  return new ApolloClient({
    uri: getConfig().publicRuntimeConfig.BLOCKSCOUT.uri,
    cache: new InMemoryCache(),
    // TODO: Remove this workaround when the backend service fixes not needed errors
    fetch: async (...args) => {
      const response = await fetch(...args)
      const { data } = await response.json()
      return new (Response as any)(JSON.stringify({ data }))
    },
  })
}

const query = gql`
  query ValidatorGroups {
    latestBlock
    celoValidatorGroups {
      account {
        address
        lockedGold
        name
        usd
      }
      affiliates(first: 20) {
        edges {
          node {
            address
            lastElected
            lastOnline
            lockedGold
            name
            score
            usd
          }
        }
      }
      accumulatedRewards
      accumulatedActive
      commission
      votes
      receivableVotes
      numMembers
      rewardsRatio
    }
  }
`

class ValidatorsListApp extends React.PureComponent<I18nProps> {
  render() {
    if (!getConfig().publicRuntimeConfig.FLAGS.VALIDATORS) {
      return null
    }
    return (
      <>
        <OpenGraph
          title="Celo Validator Explorer"
          path={menuItems.VALIDATORS_LIST.link}
          description="View status of Validators on the Celo Network"
        />
        <ApolloProvider client={createApolloClient()}>
          <Query query={query}>
            {({ loading, error, data }) => {
              if (error) {
                return (
                  <View
                    style={[
                      standardStyles.darkBackground,
                      standardStyles.centered,
                      styles.fullHeight,
                    ]}
                  >
                    <ShowApolloError error={error} />
                  </View>
                )
              }
              return <ValidatorsList data={loading ? undefined : data} isLoading={loading} />
            }}
          </Query>
        </ApolloProvider>
      </>
    )
  }
}

const styles = StyleSheet.create({
  fullHeight: { minHeight: '100vh' },
})

export default withNamespaces('dev')(ValidatorsListApp)
