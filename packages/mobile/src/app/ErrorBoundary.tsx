import { getErrorMessage } from '@celo/utils/src/displayFormatting'
import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import ErrorScreen from 'src/app/ErrorScreen'
import { Namespaces, withTranslation } from 'src/i18n'

interface State {
  childError: Error | null
}

interface OwnProps {
  children: React.ReactChild
}

type Props = OwnProps & WithTranslation

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    childError: null,
  }

  componentDidCatch(error: Error, info: any) {
    this.setState({ childError: error })
    CeloAnalytics.track(CustomEventNames.error_displayed, { error: error.message }, true)
    Sentry.captureException(error)
  }

  render() {
    const { childError } = this.state
    if (childError) {
      return <ErrorScreen errorMessage={getErrorMessage(childError)} />
    }

    return this.props.children
  }
}

export default withTranslation<Props>(Namespaces.global)(ErrorBoundary)
