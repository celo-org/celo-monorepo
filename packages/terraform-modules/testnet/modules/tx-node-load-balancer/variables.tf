variable celo_env {
  type        = string
  description = "Name of the testnet Celo environment"
}

variable dns_gcloud_project {
  type        = string
  description = "Name of the Google Cloud project where Cloud DNS is"
}

variable dns_zone_name {
  type        = string
  description = "Name of the DNS zone for the domain used for the forno setup"
}

variable forno_host {
  type        = string
  description = "The host name to use for the tx node forno setup"
}

variable gcloud_project {
  type        = string
  description = "Name of the Google Cloud project to use"
}

variable gcloud_vm_service_account_email {
  type        = string
  description = "The email of the service account to associate virtual machines with"
}

variable letsencrypt_email {
  type        = string
  description = "The email to create letsencrypt certificates with"
}

variable network_name {
  type        = string
  description = "Name of the GCP network the tx-node load balancer is in"
}

variable private_tx_node_self_links {
  type        = list(string)
  description = "A list including the self_links of each private/internal tx-node"
}

variable tx_node_self_links {
  type        = list(string)
  description = "A list including the self_links of each public/external tx-node"
}
