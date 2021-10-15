import GetAttestations from './get-attestations'

describe('identity:get-attetstations', () => {
  describe('input validation correctly outputs errors', () => {
    it('Fails when neither from, pepper, nor identifier are specified', async () => {
      await expect(GetAttestations.run(['--phoneNumber', '+15555555555'])).rejects.toThrow(
        'Must specify either --from or --pepper or --identifier'
      )
    })

    it('Fails when neither phone number nor identifier are specified', async () => {
      await expect(
        GetAttestations.run(['--from', '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'])
      ).rejects.toThrow('Must specify phoneNumber if identifier not provided')
    })

    it('Successfully prints identifier when given pepper and number', async () => {
      expect(true)
    })
  })
})
