export const migrations = {
  0: (state: any) => {
    const e164NumberToAddressOld = state.identity.e164NumberToAddress
    const e164NumberToAddress: any = {}
    Object.keys(e164NumberToAddressOld).map((e164) => {
      e164NumberToAddress[e164] = [e164NumberToAddressOld[e164]]
    })
    return {
      ...state,
      identity: {
        ...state.identity,
        e164NumberToAddress,
      },
    }
  },
  1: (state: any) => {
    const [address, e164Number] = Object.entries(state.invite.invitees)[0]
    let inviteDetails = {}

    if (address) {
      inviteDetails = {
        timestamp: Date.now(),
        e164Number,
        tempWalletAddress: address,
        tempWalletPrivateKey: 'fakePrivateKey',
        tempWalletRedeemed: false,
        inviteCode: 'fakeInviteCode',
        inviteLink: 'fakeInviteLink',
      }
    }

    return {
      ...state,
      invite: {
        invitees: [inviteDetails],
        ...state.invite,
      },
    }
  },
}
