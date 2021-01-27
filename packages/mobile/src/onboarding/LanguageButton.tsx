import { RouteProp, useRoute } from '@react-navigation/native'
import locales from 'locales'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { pushToStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'

export default function LanguageButton() {
  const { t, i18n } = useTranslation()
  const route = useRoute<RouteProp<StackParamList, keyof StackParamList>>()
  const currentLanguage = locales[i18n.language]

  // Push to stack to prevent going to the initial language selection
  // when we couldn't find the best language
  const onPress = () => pushToStack(Screens.LanguageModal, { nextScreen: route.name })

  return (
    <TopBarTextButtonOnboarding
      title={currentLanguage?.name ?? t('global:unknown')}
      testID="LanguageButton"
      onPress={onPress}
    />
  )
}
