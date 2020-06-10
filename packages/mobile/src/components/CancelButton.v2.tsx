import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, TextStyle } from 'react-native'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces } from 'src/i18n'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarTextButton } from 'src/navigator/TopBarButton.v2'

interface Props {
  onCancel?: () => void
  style?: StyleProp<TextStyle>
  eventName?: CustomEventNames
}

export default function CancelButton({ eventName, onCancel, style }: Props) {
  const onPressCancel = React.useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      navigateBack()
    }
  }, [onCancel])

  const { t } = useTranslation(Namespaces.global)

  return (
    <TopBarTextButton
      testID="CancelButton"
      onPress={onPressCancel}
      titleStyle={style ? [styles.title, style] : styles.title}
      title={t('cancel')}
      eventName={eventName}
    />
  )
}

const styles = StyleSheet.create({
  title: {
    color: colors.dark,
  },
})
