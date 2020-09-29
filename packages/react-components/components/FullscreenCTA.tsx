import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={fontStyles.h1}>{title}</Text>
          <Text style={fontStyles.h2}>{subtitle}</Text>
        </View>
        {this.props.children}
        <View style={styles.button}>
          <Button
            onPress={CTAHandler}
            text={CTAText}
            type={BtnTypes.PRIMARY}
            testID="ErrorContinueButton"
          />
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    height: variables.height,
    width: variables.width,
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 120,
  },
  button: { alignItems: 'center' },
})

export default FullscreenCTA
