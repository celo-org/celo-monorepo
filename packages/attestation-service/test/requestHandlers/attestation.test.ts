import * as Logger from 'bunyan'
import { Request } from 'express'
import { anyNumber, capture, instance, mock, reset, verify, when } from 'ts-mockito'
import { findAttestationByKey } from '../../src/db'
import { Response } from '../../src/request'
import {
  handleAttestationRequest,
  INVALID_SIGNATURE_ERROR,
} from '../../src/requestHandlers/attestation'
import { rerequestAttestation } from '../../src/sms'

import ethereumJsUtil = require('ethereumjs-util')
const isValidAddressMock = jest.spyOn(ethereumJsUtil, 'isValidAddress')
const toChecksumAddressMock = jest.spyOn(ethereumJsUtil, 'toChecksumAddress')

jest.mock('../../src/db')
const findAttestationByKeyMock = findAttestationByKey as jest.Mock

jest.mock('../../src/sms')
const rerequestAttestationMock = rerequestAttestation as jest.Mock

jest.mock('@celo/identity', () => {
  const OdisUtils = {
    Query: {
      getServiceContext: () => {
        return {
          odisPubKey:
            'ru+9GmEsBi+/SHtNc4lBwR+evpvcVLcmVDYhzyveWXVwaN7EdUGF+GgUvOMMqpUAaxQl+4DkgtbTP4CIFFAUyGnZF0nRLqo64PVSv/mrGrTet0ej5cJeS1Fla+n8o5sB',
        }
      },
    },
  }
  return { OdisUtils }
})

describe('Attestation request handler', () => {
  const requestMock = mock<Request>()
  const responseMock = mock<Response>()

  beforeEach(() => {
    reset(requestMock)
    reset(responseMock)

    isValidAddressMock.mockReset()
    toChecksumAddressMock.mockReset()
    findAttestationByKeyMock.mockReset()
    rerequestAttestationMock.mockReset()

    when(responseMock.locals).thenReturn({
      logger: Logger.createLogger({
        level: 'info',
        name: 'logger',
      }),
    })
  })

  describe('handleAttestationRequest tests', () => {
    it('Should re-request for existing attestation', async () => {
      const address = '0x2F015C60E0be116B1f0CD534704Db9c92118FB6A'
      isValidAddressMock.mockReturnValue(true)
      toChecksumAddressMock.mockReturnValue(address)
      const sampleAttestation = {
        message: 'message',
        failure: () => false,
      }
      findAttestationByKeyMock.mockResolvedValue(sampleAttestation)
      rerequestAttestationMock.mockResolvedValue(sampleAttestation)
      when(responseMock.status(anyNumber())).thenReturn(responseMock)

      await handleAttestationRequest(instance(requestMock), instance(responseMock), {
        phoneNumber: '+14155550000',
        language: 'en',
        account: 'account',
        issuer: address,
        salt: 'salt',
        securityCodePrefix: 'p',
        smsRetrieverAppSig: 'sig',
        phoneNumberSignature: undefined,
      })

      expect(findAttestationByKeyMock).toBeCalledTimes(1)
      expect(rerequestAttestationMock).toBeCalledTimes(1)
      verify(responseMock.status(200)).once()
    })

    it('Should fail with 422 code with missing security code', async () => {
      const address = '0x2F015C60E0be116B1f0CD534704Db9c92118FB6A'
      isValidAddressMock.mockReturnValue(true)
      toChecksumAddressMock.mockReturnValue(address)
      const responseMockInstance = instance(responseMock)
      when(responseMock.status(anyNumber())).thenReturn(responseMockInstance)

      await handleAttestationRequest(instance(requestMock), responseMockInstance, {
        phoneNumber: '+14155550000',
        language: 'en',
        account: 'account',
        issuer: address,
        salt: 'salt',
        securityCodePrefix: '',
        smsRetrieverAppSig: 'sig',
        phoneNumberSignature: undefined,
      })

      expect(findAttestationByKeyMock).toBeCalledTimes(0)
      expect(rerequestAttestationMock).toBeCalledTimes(0)
      verify(responseMock.status(422)).once()
      const [body] = capture(responseMock.json).last()
      expect(body['success']).toBeFalsy()
      expect(body['error']).toEqual('Invalid securityCodePrefix')
    })

    it('Should fail with 422 code when address and issuer are different', async () => {
      const address = '0x2F015C60E0be116B1f0CD534704Db9c92118FB6A'
      isValidAddressMock.mockReturnValue(true)
      toChecksumAddressMock.mockReturnValue(address)
      const responseMockInstance = instance(responseMock)
      when(responseMock.status(anyNumber())).thenReturn(responseMockInstance)

      await handleAttestationRequest(instance(requestMock), responseMockInstance, {
        phoneNumber: '+14155550000',
        language: 'en',
        account: 'account',
        issuer: address + '5',
        salt: 'salt',
        securityCodePrefix: 'p',
        smsRetrieverAppSig: 'sig',
        phoneNumberSignature: undefined,
      })

      expect(findAttestationByKeyMock).toBeCalledTimes(0)
      expect(rerequestAttestationMock).toBeCalledTimes(0)
      verify(responseMock.status(422)).once()
      const [body] = capture(responseMock.json).last()
      expect(body['success']).toBeFalsy()
      expect(body['error']).toEqual(`Mismatching issuer, I am ${address}`)
    })

    it('Should fail with 422 code with wrong signature', async () => {
      const address = '0x2F015C60E0be116B1f0CD534704Db9c92118FB6A'
      isValidAddressMock.mockReturnValue(true)
      toChecksumAddressMock.mockReturnValue(address)
      findAttestationByKeyMock.mockResolvedValue(null)
      const responseMockInstance = instance(responseMock)
      when(responseMock.status(anyNumber())).thenReturn(responseMockInstance)

      await handleAttestationRequest(instance(requestMock), responseMockInstance, {
        phoneNumber: '+14155550000',
        language: 'en',
        account: 'account',
        issuer: address,
        salt: 'salt',
        securityCodePrefix: 'p',
        smsRetrieverAppSig: 'sig',
        phoneNumberSignature: 'wrongSignature',
      })

      expect(findAttestationByKeyMock).toBeCalledTimes(1)
      expect(rerequestAttestationMock).toBeCalledTimes(0)
      verify(responseMock.status(422)).once()
      const [body] = capture(responseMock.json).last()
      expect(body['success']).toBeFalsy()
      expect(body['error']).toEqual(INVALID_SIGNATURE_ERROR)
    })

    it('Should verify correctly blinded signature and return attestation', async () => {
      const address = '0x2F015C60E0be116B1f0CD534704Db9c92118FB6A'
      isValidAddressMock.mockReturnValue(true)
      toChecksumAddressMock.mockReturnValue(address)
      const sampleAttestation = {
        message: 'message',
        failure: () => false,
      }
      findAttestationByKeyMock.mockResolvedValue(sampleAttestation)
      rerequestAttestationMock.mockResolvedValue(sampleAttestation)
      when(responseMock.status(anyNumber())).thenReturn(responseMock)

      await handleAttestationRequest(instance(requestMock), instance(responseMock), {
        phoneNumber: '+14155550000',
        language: 'en',
        account: 'account',
        issuer: address,
        salt: '4EcPvcixnoe/N',
        securityCodePrefix: 'p',
        smsRetrieverAppSig: 'sig',
        phoneNumberSignature: 'xNOQZWEa6JIyuAhGf9H0Evjx60BB8PQ6E9498CTLod2PhYRypKMdwGVDtLNkptAA',
      })

      expect(findAttestationByKeyMock).toBeCalledTimes(1)
      expect(rerequestAttestationMock).toBeCalledTimes(1)
      verify(responseMock.status(200)).once()
    })

    it('Should fail with 500 code when validator address is invalid', async () => {
      const address = '0x2F015C60E0be116B1f0CD534704Db9c92118FB6A'
      isValidAddressMock.mockReturnValue(false)
      toChecksumAddressMock.mockReturnValue(address)
      const responseMockInstance = instance(responseMock)
      when(responseMock.status(anyNumber())).thenReturn(responseMockInstance)

      await handleAttestationRequest(instance(requestMock), responseMockInstance, {
        phoneNumber: '+14155550000',
        language: 'en',
        account: 'account',
        issuer: address,
        salt: 'salt',
        securityCodePrefix: 'p',
        smsRetrieverAppSig: 'sig',
        phoneNumberSignature: undefined,
      })

      expect(findAttestationByKeyMock).toBeCalledTimes(0)
      expect(rerequestAttestationMock).toBeCalledTimes(0)
      verify(responseMock.status(500)).once()
      const [body] = capture(responseMock.json).last()
      expect(body['success']).toBeFalsy()
      expect(body['error']).toEqual('Did not specify valid CELO_VALIDATOR_ADDRESS')
    })
  })
})
