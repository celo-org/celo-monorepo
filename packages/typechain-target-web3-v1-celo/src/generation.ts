import { values } from 'lodash'
import { Dictionary } from 'ts-essentials'
import {
  AbiOutputParameter,
  AbiParameter,
  Contract,
  EventDeclaration,
  EvmOutputType,
  EvmType,
  FunctionDeclaration,
  RawAbiDefinition,
  TupleType,
} from 'typechain'

export function codegen(contract: Contract, abi: RawAbiDefinition[]) {
  const template = `
  import { AbiItem, Callback, CeloTxObject, Contract, EventLog } from '@celo/connect'
  import { EventEmitter } from 'events'
  import Web3 from 'web3'
  import { ContractEvent, EventOptions } from './types'

  export interface ${contract.name} extends Contract {
    clone(): ${contract.name}
    methods: {
      ${codegenForFunctions(contract.functions)}
    }
    events: {
      ${codegenForEvents(contract.events)}
      allEvents: (
          options?: EventOptions,
          cb?: Callback<EventLog>
      ) => EventEmitter
    }
  }
  export const ABI: AbiItem[] = ${JSON.stringify(abi)}

  export function new${contract.name}(web3: Web3, address: string): ${contract.name} {
    return new web3.eth.Contract(ABI, address) as any
  }
  `

  return template
}

function codegenForFunctions(fns: Dictionary<FunctionDeclaration[]>): string {
  return values(fns)
    .map((v) => v[0])
    .map(generateFunction)
    .join('\n')
}

function generateFunction(fn: FunctionDeclaration): string {
  return `
  ${fn.name}(${generateInputTypes(fn.inputs)}): CeloTxObject<${generateOutputTypes(fn.outputs)}>;
`
}
function generateInputTypes(inputs: AbiParameter[]): string {
  if (inputs.length === 0) {
    return ''
  }
  return (
    inputs
      .map((input, index) => `${input.name || `arg${index}`}: ${generateInputType(input.type)}`)
      .join(', ') + ', '
  )
}

function generateOutputTypes(outputs: AbiOutputParameter[]): string {
  if (outputs.length === 1) {
    return generateOutputType(outputs[0].type)
  } else {
    return `{
      ${outputs.map((t) => t.name && `${t.name}: ${generateOutputType(t.type)}, `).join('')}
      ${outputs.map((t, i) => `${i}: ${generateOutputType(t.type)}`).join(', ')}
      }`
  }
}

function codegenForEvents(events: Dictionary<EventDeclaration[]>): string {
  return values(events)
    .map((e) => e[0])
    .map(generateEvent)
    .join('\n')
}

function generateEvent(event: EventDeclaration) {
  return `${event.name}: ContractEvent<${generateOutputTypes(
    event.inputs as AbiOutputParameter[]
  )}>`
}

function generateInputType(evmType: EvmType): string {
  switch (evmType.type) {
    case 'integer':
    case 'uinteger':
      return 'number | string'
    case 'address':
      return 'string'
    case 'bytes':
    case 'dynamic-bytes':
      return 'string | number[]'
    case 'array':
      return `(${generateInputType(evmType.itemType)})[]`
    case 'boolean':
      return 'boolean'
    case 'string':
      return 'string'
    case 'tuple':
      return generateTupleType(evmType, generateInputType)
  }
  return ''
}

function generateOutputType(evmType: EvmOutputType): string {
  switch (evmType.type) {
    case 'integer':
      return 'string'
    case 'uinteger':
      return 'string'
    case 'address':
      return 'string'
    case 'void':
      return 'void'
    case 'bytes':
    case 'dynamic-bytes':
      return 'string'
    case 'array':
      return `(${generateOutputType(evmType.itemType)})[]`
    case 'boolean':
      return 'boolean'
    case 'string':
      return 'string'
    case 'tuple':
      return generateTupleType(evmType, generateOutputType)
  }
  return ''
}

function generateTupleType(tuple: TupleType, generator: (evmType: EvmType) => string) {
  return (
    '{' +
    tuple.components
      .map((component) => `${component.name}: ${generator(component.type)}`)
      .join(', ') +
    '}'
  )
}
