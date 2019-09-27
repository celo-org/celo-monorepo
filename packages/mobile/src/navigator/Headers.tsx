import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { View } from 'react-native'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import DisconnectBanner from 'src/shared/DisconnectBanner'

export const nuxNavigationOptions = {
  headerStyle: {
    elevation: 0,
    height: 45,
  },
  headerLeftContainerStyle: { paddingHorizontal: 10 },
  headerLeft: <BackButton />,
  headerRightContainerStyle: { paddingHorizontal: 10 },
  headerRight: <View />,
  headerTitle: <DisconnectBanner />,
  headerTitleContainerStyle: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
}

export const nuxNavigationOptionsNoBackButton = {
  ...nuxNavigationOptions,
  headerLeft: <View />,
}

export const headerWithBackButton = {
  headerTitle: '',
  headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
  headerLeftContainerStyle: { paddingHorizontal: 20 },
  headerLeft: <BackButton />,
  headerRight: <View />, // This helps vertically center the title
}

// TODO(Rossy) align designs to consistently use back button
export const headerWithCancelButton = {
  ...headerWithBackButton,
  headerLeftContainerStyle: { paddingHorizontal: 0 },
  headerLeft: <CancelButton />,
}
