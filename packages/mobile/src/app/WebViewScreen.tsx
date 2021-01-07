import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'

type RouteProps = StackScreenProps<StackParamList, Screens.WebViewScreen>
type Props = RouteProps

export const webViewScreenNavOptions = {
  ...emptyHeader,
  headerLeft: () => (
    <TopBarTextButton
      title={i18n.t('global:close')}
      onPress={navigateBack}
      titleStyle={styles.close}
    />
  ),
}

function WebViewScreen({ route }: Props) {
  const { uri } = route.params

  return (
    <View style={styles.container}>
      <WebView style={styles.webView} source={{ uri }} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
  webView: {
    opacity: 0.99,
  },
  close: {
    color: colors.dark,
  },
})

export default WebViewScreen
