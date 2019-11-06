import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import componentWithAnalytics from 'src/analytics/wrapper'
import Carousel, { CarouselItem } from 'src/components/Carousel'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'

class VerificationLoadingScreen extends React.Component<WithNamespaces> {
  static navigationOptions = null

  render() {
    // const { t } = this.props
    const items: CarouselItem[] = [
      {
        text: 'Test 1',
      },
      {
        text: 'Test 2',
      },
      {
        text: 'Test 3',
      },
    ]
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DevSkipButton nextScreen={Screens.WalletHome} />
          <Carousel containerStyle={styles.carouselContainer} items={items} />
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundDarker,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselContainer: {
    marginVertical: 30,
  },
})

export default componentWithAnalytics(
  withNamespaces(Namespaces.nuxVerification2)(VerificationLoadingScreen)
)
