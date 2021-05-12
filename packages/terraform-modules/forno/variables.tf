variable backend_max_requests_per_second {
  type        = number
  description = "The max number of requests per second that a backend can receive. In this case, a backend refers to all the nodes in a cluster."
}

variable celo_env {
  type        = string
  description = "Name of the Celo environment"
}

variable context_info_http {
  type = map(
    object({
      zone                                    = string
      rpc_service_network_endpoint_group_name = string
    })
  )
  description = "Provides basic information on each context for HTTP. Keys are contexts and values are the corresponding info"
}

variable context_info_ws {
  type = map(
    object({
      zone                                    = string
      rpc_service_network_endpoint_group_name = string
    })
  )
  description = "Provides basic information on each context for WS. Keys are contexts and values are the corresponding info"
}

variable gcloud_credentials_path {
  type        = string
  description = "Path to the file containing the Google Cloud credentials to use"
}

variable gcloud_project {
  type        = string
  description = "Name of the Google Cloud project to use"
}

variable ssl_cert_domains {
  type        = list(string)
  description = "Domains to use for the SSL certificate. Each must end with a period."
}

variable vpc_network_name {
  type        = string
  description = "The name of the VPC network"
}
