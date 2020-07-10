import colors from '@celo/react-components/styles/colors.v2'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  AddressValidationType,
  isFetchingAddressesSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { headerWithCancelButton } from 'src/navigator/Headers.v2'
import { replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type RouteProps = StackScreenProps<StackParamList, Screens.AddressFetchLoading>
type Props = RouteProps

function AddressFetchLoading(props: Props) {
  const dispatch = useDispatch()
  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const isFetchingAddresses = useSelector(isFetchingAddressesSelector)
  const prevIsFetchingAddressesRef = React.useRef(isFetchingAddresses)

  const { transactionData } = props.route.params
  const { recipient } = transactionData
  const { e164PhoneNumber } = recipient
  const addressValidationType = getAddressValidationType(recipient, secureSendPhoneNumberMapping)

  // TODO: Need a smoother animation here
  const delayedNavigate = () => {
    return setTimeout(() => {
      if (addressValidationType === AddressValidationType.NONE) {
        replace(Screens.SendConfirmation, { transactionData })
      } else {
        replace(Screens.ValidateRecipientIntro, { transactionData, addressValidationType })
      }
    }, 750)
  }

  useEffect(() => {
    if (e164PhoneNumber) {
      // Need to check latest mapping to prevent user from accepting fradulent requests
      // Unfortunately, can only check if we have recipient phone number (i.e., can't do it on
      // payment requests from requesters that the user hasn't transacted with before)
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
    <SafeAreaView style={styles.container}>
      <LoadingSpinner />
    </SafeAreaView>
  )
}

AddressFetchLoading.navigationOptions = () => {
  return headerWithCancelButton
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
