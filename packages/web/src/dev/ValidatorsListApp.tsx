import { ApolloProvider, Query } from '@apollo/react-components'
import ApolloClient from 'apollo-boost'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'cross-fetch'
import gql from 'graphql-tag'
import getConfig from 'next/config'
import { Router, withRouter } from 'next/router'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import ShowApolloError from 'src/dev/ShowApolloError'
import ValidatorsList from 'src/dev/ValidatorsList'
import { styles } from 'src/dev/ValidatorsListStyles'
import { H2 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import menuItems from 'src/shared/menu-items'
import Navigation, { NavigationTheme } from 'src/shared/navigation'
import Spinner from 'src/shared/Spinner'
import { colors, standardStyles, textStyles } from 'src/styles'

const networkMenu = [
  ['Release Candidate', menuItems.VALIDATORS_LIST.link],
  ['Baklava', menuItems.VALIDATORS_LIST__BAKLAVA.link],
  // ['Baklavastaging', menuItems.VALIDATORS_LIST_BAKLAVASTAGING.link],
]

function createApolloClient(network: string) {
  return new ApolloClient({
    uri:
      getConfig().publicRuntimeConfig.BLOCKSCOUT[network] ||
      getConfig().publicRuntimeConfig.BLOCKSCOUT.uri,
    cache: new InMemoryCache(),
    // TODO: Remove this workaround when the backend service fixes not needed errors
    fetch: async (...args) => {
      // @ts-ignore
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
        claims(first: 10) {
          edges {
            node {
              address
              element
              type
              verified
            }
          }
        }
      }
      affiliates(first: 20) {
        edges {
          node {
            account {
              claims(first: 10) {
                edges {
                  node {
                    address
                    element
                    type
                    verified
                  }
                }
              }
            }
            address
            lastElected
            lastOnline
            lockedGold
            name
            score
            usd
            attestationsFulfilled
            attestationsRequested
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

type Props = I18nProps & { network?: string; router: Router }

class ValidatorsListApp extends React.PureComponent<Props> {
  render() {
    const { network } = this.props
    if (!getConfig().publicRuntimeConfig.FLAGS.VALIDATORS) {
      return null
    }
    const networkMenuList = networkMenu.map(([name, link]) => [
      name,
      link,
      () => this.props.router.push(link),
    ])
    return (
      <>
        <OpenGraph
          title="Celo Validators"
          path={menuItems.VALIDATORS_LIST.link}
          description="View status of Validators on the Celo Network"
        />
        <View style={[styles.cover, styles.pStatic, compStyles.fullHeight]}>
          <H2
            style={[
              textStyles.center,
              standardStyles.blockMarginTopTablet,
              standardStyles.elementalMarginBottom,
              textStyles.invert,
            ]}
          >
            Validators
          </H2>
          <View>
            <View style={styles.links}>
              {networkMenuList.map(([name, link, navigate]: any) => (
                <View key={name} style={[styles.linkWrapper]}>
                  <Navigation
                    onPress={navigate}
                    text={name}
                    theme={NavigationTheme.DARK}
                    selected={this.props.router.pathname === link}
                  />
                </View>
              ))}
            </View>
          </View>
          <ApolloProvider client={createApolloClient(network)}>
            <Query query={query}>
              {({ loading, error, data }: any) => {
                if (error) {
                  return (
                    <View
                      style={[
                        standardStyles.darkBackground,
                        standardStyles.centered,
                        compStyles.useSpace,
                      ]}
                    >
                      <ShowApolloError error={error} />
                    </View>
                  )
                }
                if (!data) {
                  return (
                    <View
                      style={[
                        standardStyles.darkBackground,
                        standardStyles.centered,
                        compStyles.useSpace,
                      ]}
                    >
                      <Spinner size="medium" color={colors.white} />
                    </View>
                  )
                }
                return <ValidatorsList data={data} isLoading={loading} />
              }}
            </Query>
          </ApolloProvider>
        </View>
      </>
    )
  }
}

const compStyles = StyleSheet.create({
  fullHeight: { minHeight: 'calc(100vh - 75px)' },
  useSpace: {
    flex: 1,
    paddingBottom: '20vh',
  },
})

export default withNamespaces('dev')(withRouter<Props>(ValidatorsListApp))

export const ValidatorsListAppWithNetwork = (networkName: string) => {
  const Comp = withNamespaces('dev')(withRouter<Props>(ValidatorsListApp))
  return () => <Comp network={networkName} />
}
