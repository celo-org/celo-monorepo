backend_max_requests_per_second = 300

celo_env = "oracledev"

context_rpc_service_network_endpoint_groups = {
  gcp-test = "k8s1-8d58c190-oracledev-oracledev-fullnodes-rpc-8545-4890a565"
}

context_zones = {
  gcp-test = "us-west4-a"
}

domains = ["trevor-forno-terraform.celo-networks-dev.org."]

gcloud_credentials_path = "/Users/trevor/.celo/celo-testnet-e6b03864094f.json"
gcloud_project = "celo-testnet"


vpc_network_name = "default"
