import CircleButton from '@celo/react-components/components/CircleButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import componentWithAnalytics from 'src/analytics/wrapper'
import { sendFee } from 'src/images/Images'
import { navigateBack } from 'src/navigator/NavigationService'

type Props = WithNamespaces

class FeeEducation extends React.PureComponent<Props> {
  static navigationOptions = { header: null }
  render() {
    const { t } = this.props
    return (
      <View style={styles.container}>
        <Image source={sendFee} resizeMode={'contain'} style={styles.image} />
        <View style={styles.textBox}>
          <Text style={[fontStyles.telephoneHeadline, styles.text]}>{t('feeEducation')}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <CircleButton onPress={navigateBack} solid={true} disabled={false} />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  image: {
    width: 240,
    height: 220,
  },
  textBox: {
    marginVertical: 30,
    paddingHorizontal: 50,
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
  },
  buttonContainer: {
    marginVertical: 40,
  },
})

export default componentWithAnalytics(withNamespaces('sendFlow7')(FeeEducation))
