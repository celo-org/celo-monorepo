backend_max_requests_per_second = 300

celo_env = "oracledev"

# context_rpc_service_network_endpoint_groups = {
#   gcp-test = "k8s1-8d58c190-oracledev-oracledev-fullnodes-rpc-8545-4890a565"
#   gcp-test-asia = "k8s1-666b7bbf-oracledev-oracledev-fullnodes-rpc-8545-3dffc92a"
# }
#
# context_zones = {
#   gcp-test = "us-west4-a"
#   gcp-test-asia = "asia-northeast2-a"
# }

context_info = {
  gcp-test = {
    zone = "us-west4-a"
    rpc_service_network_endpoint_group_name = "k8s1-8d58c190-oracledev-oracledev-fullnodes-rpc-8545-4890a565"
  }
  gcp-test-asia = {
    zone = "asia-northeast2-a"
    rpc_service_network_endpoint_group_name = "k8s1-666b7bbf-oracledev-oracledev-fullnodes-rpc-8545-3dffc92a"
  }
}

domains = ["trevor-forno-terraform.celo-networks-dev.org."]

gcloud_credentials_path = "/Users/trevor/.celo/celo-testnet-e6b03864094f.json"
gcloud_project = "celo-testnet"

vpc_network_name = "default"
