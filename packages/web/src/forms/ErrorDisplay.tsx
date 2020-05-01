import * as React from 'react'
import MessageDisplay from 'src/forms/MessageDisplay'
import { NameSpaces, useTranslation } from 'src/i18n'
import { textStyles } from 'src/styles'

export enum ErrorKeys {
  'email' = 'email',
  'pleaseWait' = 'pleaseWait',
  'unknownError' = 'unknownError',
  'generic' = 'generic',
}

export function getErrorTransKey(field: string) {
  switch (field) {
    case ErrorKeys.email:
    case ErrorKeys.unknownError:
    case ErrorKeys.pleaseWait:
      return field
    default:
      return ErrorKeys.generic
  }
}

interface ErrorProps {
  field: ErrorKeys
  isShowing: boolean
}

export const ErrorDisplay = React.memo(({ field, isShowing }: ErrorProps) => {
  const { t } = useTranslation(NameSpaces.common)
  return (
    <MessageDisplay isShowing={isShowing} style={textStyles.error}>
      {field && t(`common:validationErrors.${field}`)}
    </MessageDisplay>
  )
})
