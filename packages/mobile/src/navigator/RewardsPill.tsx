import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import i18n from 'src/i18n'
import Gift from 'src/icons/Gift'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

function RewardsPill() {
  const onOpenRewards = () => navigate(Screens.ConsumerIncentivesHomeScreen)

  return (
    <TouchableOpacity style={styles.rewardsContainer} onPress={onOpenRewards} testID="EarnRewards">
      <Gift />
      <Text style={styles.earnRewardsText}>{i18n.t('global:earnRewards')}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.greenBackground,
  },
  earnRewardsText: {
    ...fontStyles.small,
    color: colors.greenStrong,
    marginLeft: 5,
  },
})

export default RewardsPill
