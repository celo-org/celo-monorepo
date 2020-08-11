import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'

export interface ModalProps {
  isVisible: boolean
  header: string
  body1: string
  body2?: string
  continueTitle: string
  onContinue: () => void
  cancelTitle?: string
  onCancel?: () => void
}

export function WarningModal({
  isVisible,
  header,
  body1,
  body2,
  continueTitle,
  cancelTitle,
  onCancel,
  onContinue,
}: ModalProps) {
  return (
    <Modal isVisible={isVisible}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalHeader}>{header}</Text>
        <Text style={fontStyles.body}>{body1}</Text>
        {body2 && <Text style={[fontStyles.body, componentStyles.marginTop10]}>{body2}</Text>}
        <View style={styles.modalButtonsContainer}>
          {cancelTitle && (
            <TextButton onPress={onCancel} style={styles.modalCancelText}>
              {cancelTitle}
            </TextButton>
          )}
          <TextButton onPress={onContinue} style={styles.modalContinueText}>
            {continueTitle}
          </TextButton>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.light,
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
    color: colors.gray5,
    paddingRight: 40,
  },
  modalContinueText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.greenBrand,
  },
})
