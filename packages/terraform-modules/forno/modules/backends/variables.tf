variable backend_max_requests_per_second {
  type        = number
  description = "The max number of requests per second that a backend can receive. In this case, a backend refers to all the nodes in a cluster."
}

variable celo_env {
  type        = string
  description = "Name of the Celo environment"
}

variable context_info {
  type = map(
    object({
      zone                                    = string
      rpc_service_network_endpoint_group_name = string
    })
  )
  description = "Provides basic information on each context. Keys are contexts and values are the corresponding info"
}

variable health_check_destination_port {
  type        = number
  description = "The destination port the health check will test"
}

variable timeout_sec {
  type        = number
  description = "The timeout for the backend service in seconds"
  default     = 30
}

variable type {
  type        = string
  description = "Type of backends, only used for names"
}
