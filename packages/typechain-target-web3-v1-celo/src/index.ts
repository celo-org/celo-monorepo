import { readFileSync } from 'fs'
import { join, resolve } from 'path'
import { TContext, TFileDesc, TsGeneratorPlugin } from 'ts-generator'
import { extractAbi, getFilename, parse } from 'typechain'
import { codegen } from './generation'

export interface IWeb3Cfg {
  outDir?: string
}

const DEFAULT_OUT_PATH = './types/web3-v1-celo-ontracts/'

export default class Web3V1Celo extends TsGeneratorPlugin {
  name = 'Web3-v1-celo'

  private readonly outDirAbs: string

  constructor(ctx: TContext<IWeb3Cfg>) {
    super(ctx)

    const { cwd, rawConfig } = ctx

    this.outDirAbs = resolve(cwd, rawConfig.outDir || DEFAULT_OUT_PATH)
  }

  transformFile(file: TFileDesc): TFileDesc | void {
    const abi = extractAbi(file.contents)
    const isEmptyAbi = abi.length === 0
    if (isEmptyAbi) {
      return
    }

    const name = getFilename(file.path)

    const contract = parse(abi, name)

    return {
      path: join(this.outDirAbs, `${name}.ts`),
      contents: codegen(contract, abi),
    }
  }

  afterRun(): TFileDesc[] {
    return [
      {
        path: join(this.outDirAbs, 'types.d.ts'),
        contents: readFileSync(join(__dirname, '../static/types.d.ts'), 'utf-8'),
      },
    ]
  }
}
