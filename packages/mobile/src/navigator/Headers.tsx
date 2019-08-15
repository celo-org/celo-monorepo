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
  },
  headerLeftContainerStyle: { paddingHorizontal: 20 },
  headerLeft: <BackButton />,
  headerRightContainerStyle: { paddingRight: 15 },
  headerRight: (
    <View>
      <DisconnectBanner />
    </View>
  ),
}

export const nuxNavigationOptionsNoBackButton = {
  ...nuxNavigationOptions,
  headerLeft: null,
}

export const headerWithBackButton = {
  headerTitle: '',
  headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
  headerLeftContainerStyle: { paddingHorizontal: 10 },
  headerLeft: <BackButton />,
  headerRight: <View />, // This helps vertically center the title
}

// TODO(Rossy) align designs to consistently use back button
export const headerWithCancelButton = {
  ...headerWithBackButton,
  headerLeft: <CancelButton />,
}
