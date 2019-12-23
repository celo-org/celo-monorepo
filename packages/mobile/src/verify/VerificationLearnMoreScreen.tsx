import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import componentWithAnalytics from 'src/analytics/wrapper'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'

class VerificationLearnMoreScreen extends React.Component<WithTranslation> {
  static navigationOptions = nuxNavigationOptions

  render() {
    const { t } = this.props
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.h1} testID="VerificationLearnMoreHeader">
            {t('learnMore.header')}
          </Text>
          <Text style={styles.body}>{t('learnMore.intro')}</Text>
          <Text style={styles.bodyBold}>{t('learnMore.section1Header')}</Text>
          <Text style={styles.body}>{t('learnMore.section1Body')}</Text>
          <Text style={styles.bodyBold}>{t('learnMore.section2Header')}</Text>
          <Text style={styles.body}>{t('learnMore.section2Body')}</Text>
        </SafeAreaView>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
  },
  h1: {
    ...fontStyles.h1,
  },
  body: {
    ...fontStyles.body,
    marginTop: 10,
  },
  bodyBold: {
    ...fontStyles.body,
    ...fontStyles.bold,
    marginTop: 20,
  },
})

export default componentWithAnalytics(
  withTranslation(Namespaces.nuxVerification2)(VerificationLearnMoreScreen)
)
