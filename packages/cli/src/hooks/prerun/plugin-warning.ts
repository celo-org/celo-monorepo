import { Hook } from '@oclif/config'
import { CLIError } from '@oclif/errors'
import prompts from 'prompts'

const hook: Hook<'prerun'> = async (opts) => {
  if (['plugins:install', 'plugins:link'].includes(opts.Command.id || '')) {
    // Ask for explicit confirmation to install any plugins
    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message:
        'Installing a 3rd party plugin can be *dangerous*! Are you sure you trust this plugin and want to install it? (y/n)',
    })

    if (!response.confirmation) {
      console.info('Aborting due to user response')
      process.exit(0)
    }

    // Optional additional/alternative handling
    // If no args are passed in, default to oclif/plugin-plugins error handling
    if (opts.argv.length && !/@celo\/.*/.test(opts.argv[0])) {
      throw new CLIError(
        'Only plugins published in the @celo/ NPM scope are currently allowed to be installed.'
      )
    }
  }
}

export default hook
