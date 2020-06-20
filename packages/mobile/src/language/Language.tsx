import SelectionOption from '@celo/react-components/components/SelectionOption'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { useDispatch } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { setLanguage } from 'src/app/actions'
import { AVAILABLE_LANGUAGES } from 'src/config'
import { Namespaces } from 'src/i18n'
import { emptyHeader, headerWithBackButton } from 'src/navigator/Headers.v2'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type RouterProps = StackScreenProps<StackParamList, Screens.Language>
type Props = RouterProps

export default function Language({ route }: Props) {
  const dispatch = useDispatch()
  const { t, i18n } = useTranslation(Namespaces.accountScreen10)
  const fromSettings = route.params?.fromSettings

  function onSelect(language: string, code: string) {
    CeloAnalytics.track(CustomEventNames.language_select, { language, selectedAnswer: code })
    dispatch(setLanguage(code))
    // Wait for next frame before navigating back
    // so the user can see the changed selection briefly
    requestAnimationFrame(() => {
      if (fromSettings) {
        navigateBack()
      } else {
        navigate(Screens.JoinCelo)
      }
    })
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <Text style={styles.title} testID={'ChooseLanguageTitle'}>
          {t('selectLanguage')}
        </Text>
        {AVAILABLE_LANGUAGES.map((language) => (
          <SelectionOption
            hideCheckboxes={!fromSettings}
            text={language.name}
            key={language.code}
            onSelect={onSelect}
            isSelected={language.code === i18n.language}
            data={language.code}
            testID={`ChooseLanguage/${language.code}`}
          />
        ))}
      </SafeAreaView>
    </ScrollView>
  )
}

export function languageScreenOptions({ route }: RouterProps) {
  if (route.params?.fromSettings) {
    return headerWithBackButton
  } else {
    return emptyHeader
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  title: {
    ...fontStyles.h2,
    margin: 16,
  },
})
