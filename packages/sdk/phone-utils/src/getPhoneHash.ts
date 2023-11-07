// Remove this function causes the most weird error on celocli tests
const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  return `0x${phoneNumber + salt}`
}

export default getPhoneHash
