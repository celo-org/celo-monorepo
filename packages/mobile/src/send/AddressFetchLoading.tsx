import colors from '@celo/react-components/styles/colors.v2'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { errorSelector } from 'src/alert/reducer'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  AddressValidationType,
  isFetchingAddressesSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { headerWithCancelButton } from 'src/navigator/Headers.v2'
import { navigateBack, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type RouteProps = StackScreenProps<StackParamList, Screens.AddressFetchLoading>
type Props = RouteProps

function AddressFetchLoading(props: Props) {
  const dispatch = useDispatch()
  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const isFetchingAddresses = useSelector(isFetchingAddressesSelector)
  const error = useSelector(errorSelector)
  const prevIsFetchingAddressesRef = React.useRef(isFetchingAddresses)

  const { transactionData } = props.route.params
  const { recipient } = transactionData
  const { e164PhoneNumber } = recipient
  const addressValidationType = getAddressValidationType(recipient, secureSendPhoneNumberMapping)

  // TODO: Need a smoother animation here
  const delayedNavigate = () =>
    setTimeout(() => {
      // If there was an error fetching addresses, go back
      if (error) {
        navigateBack()
      } else if (addressValidationType === AddressValidationType.NONE) {
        replace(Screens.SendConfirmation, { transactionData })
      } else {
        replace(Screens.ValidateRecipientIntro, { transactionData, addressValidationType })
      }
    }, 750)

  useEffect(() => {
    if (e164PhoneNumber) {
      // Need to check latest mapping to prevent user from accepting fradulent requests
      dispatch(fetchAddressesAndValidate(e164PhoneNumber))
    } else {
      const delayedNavFunction = delayedNavigate()
      return () => clearTimeout(delayedNavFunction)
    }
  }, [])

  useEffect(() => {
    const prevIsFetchingAddresses = prevIsFetchingAddressesRef.current
    prevIsFetchingAddressesRef.current = isFetchingAddresses

    if (prevIsFetchingAddresses === true && isFetchingAddresses === false) {
      const delayedNavFunction = delayedNavigate()
      return () => clearTimeout(delayedNavFunction)
    }
  }, [isFetchingAddresses])

  return (
    <SafeAreaView testID={'AddressFetchLoading'} style={styles.container}>
      <LoadingSpinner />
    </SafeAreaView>
  )
}

AddressFetchLoading.navigationOptions = () => {
  return {
    ...headerWithCancelButton,
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default AddressFetchLoading
