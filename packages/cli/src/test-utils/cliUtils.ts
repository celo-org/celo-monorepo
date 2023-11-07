import { LoadOptions } from '@oclif/config'
import { BaseCommand } from '../base'

export async function testLocally(
  command: typeof BaseCommand,
  argv: string[],
  config?: LoadOptions
) {
  const extendedArgv = [...argv, '--node', 'local']
  console.log('cliUtils.ts: testLocally: extendedArgv: ', extendedArgv)
  return command.run(extendedArgv, config)
}
