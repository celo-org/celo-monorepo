import * as React from 'react'
import MessageDisplay from 'src/forms/MessageDisplay'
import { NameSpaces, useTranslation } from 'src/i18n'
import { textStyles } from 'src/styles'

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
    <MessageDisplay isShowing={isShowing} style={textStyles.error}>
      {t(`common:validationErrors.${key}`)}
    </MessageDisplay>
  )
})
