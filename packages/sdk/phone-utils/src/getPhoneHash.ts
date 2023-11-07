// Remove this function causes the most weird error on celocli tests
const getPhoneHash = (_phoneNumber: string, _salt?: string): string => {
  throw new Error('getPhoneHash is not implemented')
}

export default getPhoneHash
