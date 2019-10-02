import Button, { BtnTypes } from '@celo/react-components/components/Button'
import SectionHead from '@celo/react-components/components/SectionHead'
import TextInput, { TextInputProps } from '@celo/react-components/components/TextInput'
import withTextInputLabeling from '@celo/react-components/components/WithTextInputLabeling'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import ForwardChevron from '@celo/react-components/icons/ForwardChevron'
import QRCode from '@celo/react-components/icons/QRCode'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import { isValidAddress } from '@celo/utils/src/signatureUtils'
import { TranslationFunction } from 'i18next'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import {
  ListRenderItemInfo,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { connect } from 'react-redux'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { Namespaces } from 'src/i18n'
import Search from 'src/icons/Search'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  getRecipientFromAddress,
  NumberToRecipient,
  Recipient,
  RecipientKind,
  RecipientWithAddress,
  RecipientWithMobileNumber,
} from 'src/recipients/recipient'
import RecipientItem from 'src/recipients/RecipientItem'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { requestContactsPermission } from 'src/utils/androidPermissions'
import Logger from 'src/utils/Logger'
import { assertUnreachable } from 'src/utils/typescript'

const RecipientSearchInput = withTextInputPasteAware(
  withTextInputLabeling<TextInputProps>(TextInput)
)

const goToQrCodeScreen = () => {
  navigate(Screens.QRScanner)
}

const QRCodeCTA = ({ t }: { t: TranslationFunction }) => (
  <TouchableOpacity onPress={goToQrCodeScreen} style={style.qrcodeRow}>
    <View style={style.qrcodeIconLeft}>
      <QRCode />
    </View>
    <View style={style.qrcodeTextContainer}>
      <Text style={[fontStyles.bodySmallSemiBold, style.qrcodeText]}> {t('scanCode')} </Text>
      <Text style={[fontStyles.bodySmall, style.qrcodeText]}>{t('toSentOrRequestPayment')}</Text>
    </View>
    <ForwardChevron height={15} />
  </TouchableOpacity>
)

interface Section {
  key: string
  data: Recipient[]
}

interface Props {
  testID?: string
  showQRCode: boolean
  searchQuery: string
  sections: Section[]
  defaultCountryCode: string
  hasAcceptedContactPermission: boolean
  onSelectRecipient(recipient: Recipient): void
  onSearchQueryChanged(searchQuery: string): void
  onPermissionsAccepted(): void
}

interface StateProps {
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

type RecipientProps = Props & WithNamespaces & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  addressToE164Number: state.identity.addressToE164Number,
  recipientCache: recipientCacheSelector(state),
})

export class RecipientPicker extends React.Component<RecipientProps> {
  renderItem = ({ item, index }: ListRenderItemInfo<Recipient>) => (
    <RecipientItem recipient={item} onSelectRecipient={this.props.onSelectRecipient} />
  )

  renderSectionHeader = (info: { section: SectionListData<Section> }) => (
    <SectionHead text={info.section.key as string} />
  )

  keyExtractor = (item: Recipient, index: number) => {
    switch (item.kind) {
      case RecipientKind.Contact:
        return item.contactId + item.phoneNumberLabel + index
      case RecipientKind.MobileNumber:
        return item.e164PhoneNumber + index
      case RecipientKind.QrCode:
        return item.address + index
      case RecipientKind.Address:
        return item.address + index
      default:
        Logger.error('RecipientPicker', 'Unsupported recipient kind', item)
        throw assertUnreachable(item)
    }
  }

  renderItemSeparator = () => <View style={style.separator} />

  renderFooter = () => (
    <>
      {this.renderItemSeparator()}
      <Text style={[fontStyles.subSmall, style.footer]}>{this.props.t('searchFriends')}</Text>
    </>
  )

  renderEmptyView = (
    addressToE164Number: AddressToE164NumberType,
    recipientCache: NumberToRecipient
  ) => {
    const parsedNumber = parsePhoneNumber(this.props.searchQuery, this.props.defaultCountryCode)
    if (parsedNumber) {
      return this.renderSendToPhoneNumber(parsedNumber.displayNumber, parsedNumber.e164Number)
    }
    if (isValidAddress(this.props.searchQuery)) {
      return this.renderSendToAddress()
    }
    return this.renderNoContentEmptyView()
  }

  renderNoContentEmptyView = () => (
    <View style={style.emptyView}>
      {this.props.searchQuery !== '' ? (
        <>
          <View style={style.emptyViewBody}>
            <Text style={fontStyles.body}>{this.props.t('noResultsFor')}</Text>
            <Text style={[fontStyles.body, style.emptyViewBodyDark]}>
              {` "${this.props.searchQuery}"`}
            </Text>
          </View>
          <Text style={[fontStyles.subSmall, style.footer]}>
            {this.props.t('searchForSomeone')}
          </Text>
        </>
      ) : (
        <View style={style.emptyViewBody}>
          <Text style={fontStyles.body}>{this.props.t('noContacts')}</Text>
        </View>
      )}
    </View>
  )

  renderSendToPhoneNumber = (displayId: string, e164PhoneNumber: string) => {
    const { t, onSelectRecipient } = this.props
    const recipient: RecipientWithMobileNumber = {
      kind: RecipientKind.MobileNumber,
      displayName: t('mobileNumber'),
      displayId,
      e164PhoneNumber,
    }
    return (
      <>
        <RecipientItem recipient={recipient} onSelectRecipient={onSelectRecipient} />
        {this.renderItemSeparator()}
      </>
    )
  }

  renderRequestContactPermission = () => {
    return (
      <>
        {!this.props.hasAcceptedContactPermission && (
          <Button
            text={this.props.t('askForContactsPermissionAction')}
            style={style.button}
            onPress={this.requestContactsPermission}
            standard={true}
            type={BtnTypes.SECONDARY}
          />
        )}
      </>
    )
  }

  requestContactsPermission = async () => {
    const granted = await requestContactsPermission()

    if (granted) {
      this.props.onPermissionsAccepted()
    }
  }

  renderSendToAddress = () => {
    const { t, searchQuery, addressToE164Number, recipientCache, onSelectRecipient } = this.props
    const existingContact = getRecipientFromAddress(
      searchQuery,
      addressToE164Number,
      recipientCache
    )
    if (existingContact) {
      return (
        <>
          <RecipientItem recipient={existingContact} onSelectRecipient={onSelectRecipient} />
          {this.renderItemSeparator()}
        </>
      )
    } else {
      const recipient: RecipientWithAddress = {
        kind: RecipientKind.Address,
        displayName: t('walletAddress'),
        displayId: searchQuery.substring(2, 17) + '...',
        address: searchQuery,
      }

      return (
        <>
          <RecipientItem recipient={recipient} onSelectRecipient={onSelectRecipient} />
          {this.renderItemSeparator()}
        </>
      )
    }
  }

  render() {
    const { sections, t, addressToE164Number, recipientCache } = this.props
    const showFooter = sections.length > 0

    return (
      <View style={style.body} testID={this.props.testID}>
        <DisconnectBanner />
        <RecipientSearchInput
          placeholder={t('nameOrPhoneNumber')}
          value={this.props.searchQuery}
          onChangeText={this.props.onSearchQueryChanged}
          icon={<Search />}
          style={style.textInput}
          shouldShowClipboard={isValidAddress}
        />
        {this.props.showQRCode && <QRCodeCTA t={t} />}
        <SectionList
          renderItem={this.renderItem}
          renderSectionHeader={this.renderSectionHeader}
          sections={sections}
          ItemSeparatorComponent={this.renderItemSeparator}
          ListFooterComponent={showFooter ? this.renderFooter : undefined}
          ListEmptyComponent={this.renderEmptyView(addressToE164Number, recipientCache)}
          keyExtractor={this.keyExtractor}
          initialNumToRender={30}
          keyboardShouldPersistTaps="handled"
        />
        {this.renderRequestContactPermission()}
      </View>
    )
  }
}

const style = StyleSheet.create({
  body: {
    flex: 1,
  },
  button: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  textInput: {
    alignSelf: 'center',
    color: colors.dark,
    height: 54,
    marginHorizontal: 8,
  },
  separator: {
    backgroundColor: colors.darkLightest,
    height: 1,
    marginLeft: 60,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 50,
  },
  emptyView: {
    paddingHorizontal: 50,
    justifyContent: 'center',
  },
  emptyViewBody: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    textAlign: 'center',
  },
  emptyViewBodyDark: {
    color: colors.dark,
  },
  emptyViewBodySmall: {
    justifyContent: 'center',
    textAlign: 'center',
  },
  qrcodeRow: {
    padding: 5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
    marginHorizontal: 10,
  },
  qrcodeIconLeft: {
    borderWidth: 1,
    borderRadius: 15,
    borderColor: colors.celoGreen,
    padding: 4,
  },
  qrcodeTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    textAlignVertical: 'center',
    padding: 3,
  },
  qrcodeText: {
    alignSelf: 'center',
    lineHeight: 30,
  },
})

export default componentWithAnalytics(
  connect(
    mapStateToProps,
    {}
  )(withNamespaces(Namespaces.sendFlow7)(RecipientPicker))
)
