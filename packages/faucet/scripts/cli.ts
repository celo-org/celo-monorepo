import { execSync } from 'child_process'
import yargs from 'yargs'
import { NetworkConfig } from '../src/config'

// tslint:disable-next-line: no-unused-expression
yargs
  .scriptName('yarn cli')
  .recommendCommands()
  .demandCommand(1)
  .strict(true)
  .showHelpOnFail(true)
  .command(
    'deploy:functions',
    'Deploy Project firebase functions',
    (x) => x,
    () => deployFunctions()
  )
  .command(
    'accounts:get',
    'Get Accounts for a network',
    (args) =>
      args.option('net', {
        type: 'string',
        description: 'Name of network',
        demandOption: true,
      }),
    (args) => printAccounts(args.net)
  )
  .command(
    'accounts:clear',
    'Remova all Accounts for a network',
    (args) =>
      args.option('net', {
        type: 'string',
        description: 'Name of network',
        demandOption: true,
      }),
    (args) => clearAccounts(args.net)
  )
  .command(
    'accounts:add <pk> <address>',
    'Add an account',
    (args) =>
      args
        .option('net', {
          type: 'string',
          description: 'Name of network',
          demandOption: true,
        })
        .positional('pk', {
          type: 'string',
          description: 'Private Key. Format 0x...',
        })
        .positional('address', {
          type: 'string',
          description: 'Address. Format 0x...',
        })
        .demand(['pk', 'address']),
    (args) => addAccount(args.net, args.pk, args.address)
  )
  .command(
    'faucet:request <to>',
    'Request Funds',
    (args) =>
      args
        .option('net', {
          type: 'string',
          description: 'Name of network',
          demand: true,
        })
        .option('to', {
          type: 'string',
          description: 'Address',
          demand: true,
        }),
    (args) => enqueueFundRequest(args.net, args.to)
  )
  .command(
    'faucet:invite <to>',
    'Invite and Faucet User',
    (args) =>
      args
        .option('net', {
          type: 'string',
          description: 'Name of network',
          demand: true,
        })
        .option('to', {
          type: 'string',
          description: 'Phone Number',
          demand: true,
        }),
    (args) => enqueueInviteRequest(args.net, args.to)
  )
  .command(
    'config:get',
    'Get Config for a network',
    (args) =>
      args.option('net', {
        type: 'string',
        description: 'Name of network',
      }),
    (args) => printConfig(args.net)
  )
  .command(
    'config:set',
    'Configure the environment',
    (args) =>
      args
        .option('nodeUrl', {
          type: 'string',
        })
        .option('faucetGoldAmount', {
          type: 'string',
        })
        .option('faucetDollarAmount', {
          type: 'string',
        })
        .option('inviteGoldAmount', {
          type: 'string',
        })
        .option('inviteDollarAmount', {
          type: 'string',
        })
        .option('escrowDollarAmount', {
          type: 'string',
        })
        .option('net', {
          type: 'string',
          description: 'Name of network',
          demand: true,
        })
        .option('goldTokenAddress', {
          type: 'string',
          description: 'Address for gold token contract',
        })
        .option('stableTokenAddress', {
          type: 'string',
          description: 'Address for stable token contract',
        })
        .option('escrowAddress', {
          type: 'string',
          description: 'Address for escrow contract',
        })
        .option('expirySeconds', {
          type: 'number',
          description: 'Seconds before the escrow expires',
        })
        .option('minAttestations', {
          type: 'number',
          description: 'How mannu attestations required before releasing the escrowed funds',
        })
        .option('twilioAuthToken', {
          type: 'string',
          description: 'Auth token for twilio client',
        })
        .option('twilioSID', {
          type: 'string',
          description: 'SID for twilio client',
        })
        .option('twilioPhoneNumber', {
          type: 'string',
          description: 'Phone number to send from for twilio client',
        })
        .option('deploy', {
          type: 'boolean',
          description: 'Wether to deploy functions after set config',
        }),
    (args) => {
      setConfig(args.net, {
        faucetGoldAmount: args.faucetGoldAmount,
        faucetDollarAmount: args.faucetDollarAmount,
        inviteGoldAmount: args.inviteGoldAmount,
        inviteDollarAmount: args.inviteDollarAmount,
        escrowDollarAmount: args.escrowDollarAmount,
        nodeUrl: args.nodeUrl,
        minAttestations: args.minAttestations,
        expirySeconds: args.expirySeconds,
        twilioPhoneNumber: args.twilioPhoneNumber,
        twilioAuthToken: args.twilioAuthToken,
        twilioSID: args.twilioSID,
        twilioClient: null,
      })
      if (args.deploy) {
        deployFunctions()
      }
    }
  ).argv

interface TwilioParams {
  twilioPhoneNumber: string
  twilioAuthToken: string
  twilioSID: string
}

function setConfig(network: string, config: Partial<NetworkConfig & TwilioParams>) {
  const setIfPresent = (name: string, value?: string | number | null) =>
    value ? `faucet.${network}.${name}="${value}"` : ''
  const variables = [
    setIfPresent('node_url', config.nodeUrl),
    setIfPresent('faucet_gold_amount', config.faucetGoldAmount),
    setIfPresent('faucet_dollar_amount', config.faucetDollarAmount),
    setIfPresent('invite_gold_amount', config.inviteGoldAmount),
    setIfPresent('invite_dollar_amount', config.inviteDollarAmount),
    setIfPresent('escrow_dollar_amount', config.escrowDollarAmount),
    setIfPresent('expiry_seconds', config.expirySeconds),
    setIfPresent('min_attestations', config.minAttestations),
    setIfPresent('twilio_phone_number', config.twilioPhoneNumber),
    setIfPresent('twilio_auth_token', config.twilioAuthToken),
    setIfPresent('twilio_sid', config.twilioSID),
  ].join(' ')
  execSync(`yarn firebase functions:config:set ${variables}`, { stdio: 'inherit' })
}

function printConfig(network?: string) {
  if (network != null) {
    execSync(`yarn firebase functions:config:get faucet.${network}`, { stdio: 'inherit' })
  } else {
    execSync(`yarn firebase functions:config:get faucet`, { stdio: 'inherit' })
  }
}

function printAccounts(network: string) {
  execSync(`yarn firebase database:get --pretty /${network}/accounts`, { stdio: 'inherit' })
}

function enqueueFundRequest(network: string, address: string) {
  const request = {
    beneficiary: address,
    status: 'Pending',
    type: 'Faucet',
  }
  const data = JSON.stringify(request)
  execSync(`yarn firebase database:push  -d '${data}' /${network}/requests`, { stdio: 'inherit' })
}

function enqueueInviteRequest(network: string, phone: string) {
  const request = {
    beneficiary: phone,
    status: 'Pending',
    type: 'Invite',
  }
  const data = JSON.stringify(request)
  execSync(`yarn firebase database:push  -d '${data}' /${network}/requests`, { stdio: 'inherit' })
}

function addAccount(network: string, pk: string, address: string) {
  const account = {
    pk,
    address,
    locked: false,
  }
  const data = JSON.stringify(account)
  execSync(`yarn firebase database:push  -d '${data}' /${network}/accounts`, { stdio: 'inherit' })
}

function clearAccounts(network: string) {
  execSync(`yarn firebase database:remove  /${network}/accounts`, { stdio: 'inherit' })
}

function deployFunctions() {
  execSync(`yarn firebase deploy --only functions:faucetRequestProcessor`, {
    stdio: 'inherit',
  })
}
