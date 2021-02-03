import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch } from 'react-redux'
import { openDeepLink } from 'src/app/actions'
import WebView from 'src/components/WebView'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { parse } from 'url'

type RouteProps = StackScreenProps<StackParamList, Screens.WebViewScreen>
type Props = RouteProps

export const webViewScreenNavOptions = ({ route }: RouteProps) => {
  const { hostname } = parse(route.params.uri)
  return {
    ...emptyHeader,
    headerTitle: hostname || ' ',
    headerLeft: () => (
      <TopBarTextButton
        title={i18n.t('global:close')}
        onPress={navigateBack}
        titleStyle={styles.close}
      />
    ),
  }
}

function WebViewScreen({ route }: Props) {
  const { uri } = route.params
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)

  const handleLoadRequest = (event: ShouldStartLoadRequest): boolean => {
    if (event.url.startsWith('celo://')) {
      dispatch(openDeepLink(event.url))
      return false
    }
    return true
  }

  const hideLoading = () => {
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['https://*', 'celo://*']}
        onShouldStartLoadWithRequest={handleLoadRequest}
        setSupportMultipleWindows={false}
        source={{ uri }}
        onLoad={hideLoading}
      />
      {loading && <ActivityIndicator style={styles.loading} size="large" />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  close: {
    color: colors.dark,
  },
})

export default WebViewScreen
