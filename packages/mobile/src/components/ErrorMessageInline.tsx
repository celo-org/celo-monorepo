import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { ErrorDisplayType } from 'src/alert/reducer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces, withTranslation } from 'src/i18n'
import { RootState } from 'src/redux/reducers'

const DISMISS_DEFAULT = 5

interface StateProps {
  displayMethod: ErrorDisplayType | null
}

interface OwnProps {
  error?: ErrorMessages | null
  dismissAfter?: number
}

interface DispatchProps {
  hideAlert: typeof hideAlert
}

const mapStateToProps = (state: RootState): StateProps => {
  const displayMethod = state.alert ? state.alert.displayMethod : null
  return {
    displayMethod,
  }
}

const mapDispatchToProps = {
  hideAlert,
}

type Props = DispatchProps & OwnProps & WithTranslation & StateProps

function ErrorMessageInline(props: Props) {
  const { error, displayMethod, dismissAfter, t } = props

  // Want to initiate/cleanup a timer for each new error
  React.useEffect(() => {
    const timer = window.setTimeout(props.hideAlert, (dismissAfter || DISMISS_DEFAULT) * 1000)
    return () => window.clearTimeout(timer)
  }, [error])

  // Keep the space empty when there isn't an inline error
  // displayMethod lives in redux store and we want to be able to use this component
  // without populating it so much check if other types are already displayed
  // rather than if INLINE is
  if (!error || displayMethod === ErrorDisplayType.BANNER) {
    return <View style={dismissAfter !== null && styles.errorContainer} />
  }

  return (
    <View style={dismissAfter !== null && styles.errorContainer}>
      <Text style={styles.errorMessage}>{t(error)} </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    height: 64,
  },
  errorMessage: {
    ...fontStyles.small,
    color: colors.warning,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  (state: RootState) => mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.global)(ErrorMessageInline))
