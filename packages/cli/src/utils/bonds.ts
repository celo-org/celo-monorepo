export const BondArgs = {
  noticePeriodArg: {
    name: 'noticePeriod',
    description:
      'duration (seconds) from notice to withdrawable; doubles as ID of a bonded deposit; ',
  },
  availabilityTimeArg: {
    name: 'availabilityTime',
    description: 'unix timestamp at which withdrawable; doubles as ID of a notified deposit',
  },
  goldAmountArg: {
    name: 'goldAmount',
    description: 'unit amount of gold token (cGLD)',
  },
}
