import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { NameSpaces, useTranslation } from 'src/i18n'
import { fonts, textStyles } from 'src/styles'

type Field = string

function getErrorTransKey(field: string) {
  let key = 'generic'

  if (field === 'email' || key === 'unknownError') {
    key = field
  }
  return key
}

interface ErrorProps {
  field: Field
  isShowing: boolean
}

export const ErrorDisplay = React.memo(({ field, isShowing }: ErrorProps) => {
  const { t } = useTranslation(NameSpaces.common)
  const key = getErrorTransKey(field)
  return (
    <View style={[styles.container, !isShowing && styles.containerCollapsed]}>
      <Text
        style={[
          fonts.h6,
          textStyles.error,
          styles.text,
          isShowing ? styles.showingError : styles.hidingError,
        ]}
      >
        {t(`common:validationErrors.${key}`)}
      </Text>
    </View>
  )
})

interface Props {
  allErrors: Field[]
  field: Field
}

export const ErrorMessage = React.memo(function _ErrorMessage({ allErrors, field }: Props) {
  const isShowing = allErrors.includes(field)
  return <ErrorDisplay field={field} isShowing={isShowing} />
})

const styles = StyleSheet.create({
  text: {
    transitionProperty: 'opacity',
    transitionDuration: '700ms',
  },
  showingError: {
    opacity: 100,
  },
  hidingError: {
    opacity: 0,
  },
  container: {
    marginVertical: 5,
    height: 'auto',
    maxHeight: 80,
    transitionProperty: 'max-height',
    transitionDuration: '600ms',
  },
  containerCollapsed: {
    maxHeight: 0,
  },
})
