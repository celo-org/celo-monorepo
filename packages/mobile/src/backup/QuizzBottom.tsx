import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import colors from '@celo/react-components/styles/colors'
import fonts from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Mode } from 'src/backup/BackupQuiz'
import { Namespaces } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'

interface Props {
  onPressSubmit: () => void
  isQuizComplete: boolean
  mode: Mode
}

export function QuizzBottom({ onPressSubmit, isQuizComplete, mode }: Props) {
  const { t } = useTranslation(Namespaces.backupKeyFlow6)
  if (!isQuizComplete) {
    return null
  }
  switch (mode) {
    case Mode.Checking:
      return (
        <View style={styles.successCheck}>
          <LoadingSpinner width={24} />
        </View>
      )
    case Mode.Failed:
      return (
        <View>
          <Text style={styles.incorrect}>{t('backupQuizFailed')}</Text>
        </View>
      )
    default:
      return (
        <Button
          onPress={onPressSubmit}
          text={t('global:submit')}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          testID={'QuizSubmit'}
        />
      )
  }
}

const styles = StyleSheet.create({
  successCheck: {
    alignItems: 'center',
    marginBottom: 24,
  },
  incorrect: {
    ...fonts.regular500,
    textAlign: 'center',
    color: colors.warning,
  },
})
