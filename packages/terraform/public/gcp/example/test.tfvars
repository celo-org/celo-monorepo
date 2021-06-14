# Provide the next vars with a vars-file or modifying the default value
google = {
  project = "canvas-genius-243518"
  region  = "us-west1"
  zone    = "us-west1-a"
}
celo_env = "baklava"
network_id = 200110
ethstats_host = "baklava-ethstats.celo-testnet.org"
geth_node_docker_image = {
  repository = "us.gcr.io/celo-testnet/celo-node"
  tag        = "baklava"
}
replicas = {
  validator           = 1 # Also used for proxy
  txnode              = 1
  attestation_service = 1
}
validator_signer_accounts = {
  account_addresses = [
    "0x452C17dd9D18E711F7a8C67776B7c2A4c51E5fD4",
  ]
  private_keys = [
    "7a2cb2c5c1fe4a0ddd945ababc3e2701d82c471e960df9ecc06ce1b0e4b86d69",
  ]
  account_passwords = [
    "secret1",
  ]
}
proxy_accounts = {
  account_addresses = [
    "0xF2bF17B75d23Ae917f0A240ce095010a03ef96B8",
  ]
  private_keys = [
    "1b54ed565ce00d86b7318881f2413c1fc40911b5ea3a33025ec97b0c2ac73955",
  ]
  enodes = [
    "f823bbcde4f493e01ab4d155ba8aba2e99ae91034c0914061832f5c42514514a20418196cc118789bfd24c42cb240792aa265570ff71c05d2e8fc95ec8795187",
  ]
}
attestation_signer_accounts = {
  account_addresses = [
    "0x452C17dd9D18E711F7a8C67776B7c2A4c51E5fD4",
  ]
  private_keys = [
    "1b54ed565ce00d86b7318881f2413c1fc40911b5ea3a33025ec97b0c2ac73955",
  ]
}
validator_name = "jcortejoso"
proxy_name = "jcortejoso-proxy"
reset_geth_data = false
attestation_service_credentials = {
  sms_providers                = "twilio"
  // nexmo_key                    = "2bcadef7"
  // nexmo_secret                 = "&cRm8obv8Bvb"
  nexmo_key                    = ""
  nexmo_secret                 = ""
  nexmo_blacklist              = ""
  twilio_account_sid           = "ACd1db5b441421b43b855397aab49834f9"
  twilio_messaging_service_sid = "MG3828c6f6d5ea3c6c65e92d7860ce3164"
  twilio_auth_token            = "54b5c5cbf7bb6d205e9a729dee821fb9"
  twilio_blacklist             = ""
}
