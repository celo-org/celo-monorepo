import { ADDRESS_LENGTH } from 'src/exchange/reducer'

export const isAddressFormat = (content: string): boolean => {
  return content.startsWith('0x') && content.length === ADDRESS_LENGTH
}
