import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Namespaces } from 'locales'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SwitchButton from 'src/components/HomeScreen/SwitchButton'

type Props = {
  isVerifying: boolean
  networkType: string
  toggleVerifyingService: () => void
} & WithNamespaces

class Verifying extends React.PureComponent<Props, {}> {
  render() {
    const { isVerifying, t } = this.props

    let containerStyle, onOrOffText
    if (isVerifying) {
      containerStyle = styles.container
      onOrOffText = t('on')
    } else {
      containerStyle = [styles.container, offStyles.container]
      onOrOffText = t('off')
    }
    return (
      <View style={containerStyle}>
        <Text style={fontStyles.bodySecondary}>
          {`${t('verifying')}: `}
          <Text style={[fontStyles.bodySecondary, styles.emphasis]}>{onOrOffText}</Text>
        </Text>
        <SwitchButton switchStatus={isVerifying} onToggle={this.props.toggleVerifyingService} />
      </View>
    )
  }
}

const offStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.inactiveLabelBar,
  },
})

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: colors.darkLightest,
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  emphasis: {
    color: colors.dark,
  },
})

export default withNamespaces(Namespaces.profile)(Verifying)
