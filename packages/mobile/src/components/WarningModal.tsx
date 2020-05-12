import SettingsSwitchItem from '@celo/react-components/components/SettingsSwitchItem'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import { toggleFornoMode } from 'src/web3/actions'

export interface ModalProps {
  isVisible: boolean
  header: string
  body: string
  continueTitle: string
  cancelTitle: string
  onCancel: () => void
  onContinue: () => void
}

export function WarningModal({
  isVisible,
  header,
  body,
  continueTitle,
  cancelTitle,
  onCancel,
  onContinue,
}: ModalProps) {
  return (
    <Modal isVisible={isVisible}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalHeader}>{header}</Text>
        <Text style={fontStyles.body}>{body}</Text>
        <View style={styles.modalButtonsContainer}>
          <TextButton onPress={onCancel} style={styles.modalCancelText}>
            {cancelTitle}
          </TextButton>
          <TextButton onPress={onContinue} style={styles.modalSkipText}>
            {continueTitle}
          </TextButton>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    ...fontStyles.bold,
    marginVertical: 15,
  },
  modalButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalCancelText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    paddingRight: 20,
  },
  modalSkipText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.celoGreen,
    paddingLeft: 20,
  },
})
