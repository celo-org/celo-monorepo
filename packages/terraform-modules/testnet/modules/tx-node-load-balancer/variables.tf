variable celo_env {
  type        = string
  description = "Name of the testnet Celo environment"
}

variable dns_zone_name {
  type        = string
  description = "Name of the DNS zone for the domain used for the infura-like setup"
}

variable gcloud_credentials_path {
  type        = string
  description = "Path to the file containing the Google Cloud credentials to use"
}

variable gcloud_project {
  type        = string
  description = "Name of the Google Cloud project to use"
}

variable infura_setup_host {
  type        = string
  description = "The host name to use for the tx node infura-setup"
}

variable network_name {
  type        = string
  description = "Name of the GCP network the tx-node load balancer is in"
}

variable tx_node_self_links {
  type        = list(string)
  description = "A list including the self_links of each tx-node"
}
