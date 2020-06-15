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
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = StackScreenProps<StackParamList, Screens.Language>

export default function Language({ route }: Props) {
  const dispatch = useDispatch()
  const { t, i18n } = useTranslation(Namespaces.accountScreen10)

  function onSelect(language: string, code: string) {
    CeloAnalytics.track(CustomEventNames.language_select, { language, selectedAnswer: code })
    const nextScreen = route.params?.nextScreen ?? Screens.JoinCelo
    dispatch(setLanguage(code))
    if (nextScreen === 'GO_BACK') {
      navigateBack()
    } else {
      navigate(nextScreen)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <Text style={styles.title} testID={'ChooseLanguageTitle'}>
          {t('selectLanguage')}
        </Text>
        {AVAILABLE_LANGUAGES.map((language) => (
          <SelectionOption
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  title: {
    ...fontStyles.h2,
    marginHorizontal: 16,
    marginVertical: 16,
  },
})
