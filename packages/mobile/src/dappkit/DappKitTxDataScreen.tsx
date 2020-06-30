import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = WithTranslation & StackScreenProps<StackParamList, Screens.DappKitTxDataScreen>

class DappKitTxDataScreen extends React.Component<Props> {
  static navigationOptions = headerWithBackButton

  render() {
    const dappKitData = this.props.route.params.dappKitData

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

export default withTranslation<Props>(Namespaces.dappkit)(DappKitTxDataScreen)
