import { Text, View, StyleSheet } from 'react-native'
import { withNamespaces, Namespace } from 'react-i18next'
import * as React from 'react'
import { colors } from 'src/styles'
import { H1 } from 'src/fonts/Fonts'
import Fade from 'react-reveal/Fade'

export default withNamespaces()(
  React.memo(function Intro() {
    return (
      <View style={styles.container}>
        <H1>Welcome To Celo Brand Kit</H1>
      </View>
    )
  })
)

const styles = StyleSheet.create({
  container: { height: '100%' },
})
