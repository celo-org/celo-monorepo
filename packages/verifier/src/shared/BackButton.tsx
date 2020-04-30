import BackButton from '@celo/react-components/components/BackButton'
import { navigateBack } from '@celo/react-components/services/NavigationService'
import * as React from 'react'

export default function VerifierBackButton() {
  return <BackButton navigateBack={navigateBack} />
}
