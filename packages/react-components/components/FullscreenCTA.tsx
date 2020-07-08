import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export interface Props {
  title: string
  CTAText: string
  CTAHandler: () => void
  subtitle?: string
}

class FullscreenCTA extends React.PureComponent<Props> {
  render() {
    const { title, subtitle, CTAText, CTAHandler } = this.props

    return (
      <SafeAreaView style={style.container}>
        <View style={style.header}>
          <Text style={fontStyles.h1}>{title}</Text>
          <Text style={fontStyles.h2}>{subtitle}</Text>
        </View>
        {this.props.children}
        <View style={style.button}>
          <Button
            onPress={CTAHandler}
            text={CTAText}
            standard={true}
            type={BtnTypes.PRIMARY}
            testID="ErrorContinueButton"
          />
        </View>
      </SafeAreaView>
    )
  }
}

const style = StyleSheet.create({
  container: {
    height: variables.height,
    width: variables.width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  header: {},
  button: { alignItems: 'center' },
})

export default FullscreenCTA
