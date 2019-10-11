import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'

type Props = NavigationInjectedProps & WithNamespaces

class DappKitTxDataScreen extends React.Component<Props> {
  static navigationOptions = headerWithBackButton

  render() {
    const dappKitData = this.props.navigation.getParam('dappKitData')

    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.header}>{t('data')}</Text>
          <Text style={styles.bodyText}>{dappKitData}</Text>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
    marginHorizontal: '5%',
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingBottom: 15,
  },
  bodyText: {
    ...fontStyles.paragraph,
    fontSize: 15,
    color: colors.darkSecondary,
  },
})

export default withNamespaces(Namespaces.dappkit)(DappKitTxDataScreen)
