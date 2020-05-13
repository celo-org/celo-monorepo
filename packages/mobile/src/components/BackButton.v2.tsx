import BackButton from '@celo/react-components/components/BackButton.v2'
import React, { useCallback } from 'react'
import { navigateBack } from 'src/navigator/NavigationService'

export default function MobileBackButton(props: { height?: number; color?: string }) {
  const goBack = useCallback(() => navigateBack(), [navigateBack])
  return <BackButton onPress={goBack} {...props} />
}
