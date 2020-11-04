import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import * as t from 'io-ts'

export enum ActionTypes {
  StartSession = 'StartSession',
  DeployWallet = 'DeployWallet',
  DistributedBlindedPepper = 'DistributedBlindedPepper',
  SubmitMetaTransaction = 'SubmitMetaTransaction',
  RequestSubsidisedAttestation = 'RequestSubsidisedAttestation',
  CheckService = 'CheckService',
  CheckSession = 'CheckSession',
}

export enum RequestMethod {
  POST = 'POST',
  GET = 'GET',
}

export interface Action<TAction, TPayload, TResp> {
  method: RequestMethod
  action: TAction
  path: string
  payload: TPayload
  codec: t.Type<TResp>
}

type ActionFactory<TAction, TPayload, TResp> = (
  payload: TPayload
) => Action<TAction, TPayload, TResp>

export const action = <TAction, TPayload, TResp>(
  actionType: TAction,
  method: RequestMethod,
  path: string,
  codec: t.Type<TResp>
): ActionFactory<TAction, TPayload, TResp> => (payload) => ({
  method,
  path,
  action: actionType,
  codec,
  payload,
})

export const CheckServiceResponse = t.type({
  status: t.string,
})

export type CheckServiceResponse = t.TypeOf<typeof CheckServiceResponse>

const _checkService = action<ActionTypes.CheckService, null, CheckServiceResponse>(
  ActionTypes.CheckService,
  RequestMethod.GET,
  'v1/health',
  CheckServiceResponse
)

export const checkService = () => _checkService(null)

export const CheckSessionResp = t.type({
  quotaLeft: t.type({
    distributedBlindedPepper: t.number,
    requestSubsidisedAttestation: t.number,
    submitMetaTransaction: t.number,
  }),
  metaTxWalletAddress: t.union([t.undefined, t.string]),
})

export type CheckSessionResp = t.TypeOf<typeof CheckSessionResp>

export const _checkSession = action<ActionTypes.CheckSession, null, CheckSessionResp>(
  ActionTypes.CheckSession,
  RequestMethod.GET,
  'v1/checkSession',
  CheckSessionResp
)

export const checkSession = () => _checkSession(null)

export interface StartSessionPayload {
  captchaResponseToken: string
  externalAccount: string
  signature: string
}

export const StartSessionResp = t.type({
  token: t.string,
})

export type StartSessionResp = t.TypeOf<typeof StartSessionResp>

export const startSession = action<ActionTypes.StartSession, StartSessionPayload, StartSessionResp>(
  ActionTypes.StartSession,
  RequestMethod.POST,
  'v1/startSession',
  StartSessionResp
)

interface GetDistributedBlindedPepperPayload {
  blindedPhoneNumber: string
  clientVersion: string
}

export const GetCombinedSignatureResp = t.type({
  combinedSignature: t.string,
})

export type GetCombinedSignatureResp = t.TypeOf<typeof GetCombinedSignatureResp>

export const GetDistributedBlindedPepperResp = t.type({
  identifier: t.string,
  pepper: t.string,
})

export type GetDistributedBlindedPepperResp = t.TypeOf<typeof GetDistributedBlindedPepperResp>

export const getDistributedBlindedPepper = action<
  ActionTypes.DistributedBlindedPepper,
  GetDistributedBlindedPepperPayload,
  GetCombinedSignatureResp
>(
  ActionTypes.DistributedBlindedPepper,
  RequestMethod.POST,
  'v1/distributedBlindedPepper',
  GetCombinedSignatureResp
)

// export interface DeployWalletPayload {}

export const DeployWalletDeployed = t.type({
  status: t.literal('deployed'),
  walletAddress: t.string,
})

export type DeployWalletDeployed = t.TypeOf<typeof DeployWalletDeployed>

export const DeployWalletInProgress = t.type({
  status: t.literal('in-progress'),
  txHash: t.string,
  deployerAddress: t.string,
})

export type DeployWalletInProgress = t.TypeOf<typeof DeployWalletInProgress>

export const DeployWalletResp = t.union([DeployWalletDeployed, DeployWalletInProgress])
export type DeployWalletResp = t.TypeOf<typeof DeployWalletResp>

export interface DeployWalletPayload {
  implementationAddress: string
}

export const deployWallet = action<ActionTypes.DeployWallet, DeployWalletPayload, DeployWalletResp>(
  ActionTypes.DeployWallet,
  RequestMethod.POST,
  'v1/deployWallet',
  DeployWalletResp
)

export const SubmitMetaTransactionResp = t.type({
  txHash: t.string,
})

export type SubmitMetaTransactionResp = t.TypeOf<typeof SubmitMetaTransactionResp>

export const submitMetaTransaction = action<ActionTypes, RawTransaction, SubmitMetaTransactionResp>(
  ActionTypes.SubmitMetaTransaction,
  RequestMethod.POST,
  'v1/submitMetaTransaction',
  SubmitMetaTransactionResp
)

export interface RequestSubsidisedAttestationsPayload {
  identifier: string
  attestationsRequested: number
  walletAddress: string
  requestTx: RawTransaction
}

export const requestSubsidisedAttestations = action<
  ActionTypes.RequestSubsidisedAttestation,
  RequestSubsidisedAttestationsPayload,
  SubmitMetaTransactionResp
>(
  ActionTypes.RequestSubsidisedAttestation,
  RequestMethod.POST,
  'v1/requestSubsidisedAttestations',
  SubmitMetaTransactionResp
)
