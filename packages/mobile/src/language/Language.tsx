import LanguageSelectUI from '@celo/react-components/components/LanguageSelectUI'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { setLanguage } from 'src/app/actions'
import { AVAILABLE_LANGUAGES } from 'src/config'
import i18n, { Namespaces } from 'src/i18n'
import logo from 'src/images/celo-logo.png'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

export function Language() {
  const [selectedAnswer, setAnswer] = useState(i18n.language || '')
  const navigation = useNavigation<NavigationProp<StackParamList, Screens.Language>>()
  const route = useRoute<RouteProp<StackParamList, Screens.Language>>()
  const dispatch = useDispatch()
  const { t } = useTranslation(Namespaces.accountScreen10)

  const onSelectAnswer = (language: string, code: string) => {
    CeloAnalytics.track(CustomEventNames.language_select, { language, selectedAnswer: code })
    setAnswer(code)
  }

  const onSubmit = () => {
    const nextScreen = route.params?.nextScreen ?? Screens.JoinCelo
    CeloAnalytics.track(CustomEventNames.nux_continue, {
      nextScreen,
      selectedAnswer,
    })
    dispatch(setLanguage(selectedAnswer))
    navigation.navigate(nextScreen)
    dispatch(setLanguage(selectedAnswer))
  }

  return (
    <LanguageSelectUI
      logo={logo}
      onLanguageSelected={onSelectAnswer}
      onSubmit={onSubmit}
      isSubmitDisabled={!selectedAnswer}
      currentSelected={selectedAnswer}
      languages={AVAILABLE_LANGUAGES}
      t={t}
    />
  )
}

export default Language
