variable backend_max_requests_per_second {
  type        = number
  description = "The max number of requests per second that this backend can receive"
}

variable celo_env {
  type        = string
  description = "Name of the Celo environment"
}

variable http_context_info {
  type        = map(
    object({
      zone = string
      rpc_service_network_endpoint_group_name = string
    })
  )
  description = "Provides basic information on each context. Keys are contexts and values are the corresponding info"
}

variable ws_context_info {
  type        = map(
    object({
      zone = string
      rpc_service_network_endpoint_group_name = string
    })
  )
  description = "Provides basic information on each context. Keys are contexts and values are the corresponding info"
}

# variable context_rpc_service_network_endpoint_groups {
#   type        = map(string)
#   description = "Names of different contexts as keys and the network endpoint group name of the RPC service this backend will use as values"
# }
#
# variable context_zones {
#   type        = map(string)
#   description = "Names of different contexts as keys and their GCP zone as values"
# }

variable domains {
  type        = list(string)
  description = "Domains to use. Each must end with a period."
}

variable gcloud_credentials_path {
  type        = string
  description = "Path to the file containing the Google Cloud credentials to use"
}

variable gcloud_project {
  type        = string
  description = "Name of the Google Cloud project to use"
}

variable vpc_network_name {
  type        = string
  description = "The name of the VPC network"
}
