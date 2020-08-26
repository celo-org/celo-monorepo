{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "celo-fullnode.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "celo-fullnode.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "celo-fullnode.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "celo-fullnode.labels" -}}
{{ include "common.standard.labels" . }}
component: celo-fullnode
{{- end -}}

{{- define "celo-fullnode.rpc-ports" -}}
- port: 8545
  targetPort: rpc
  protocol: TCP
  name: rpc
- port: 8546
  targetPort: ws
  protocol: TCP
  name: ws
{{- end -}}

{{/*
 * AWS requires a network load balancer to have a distinct public IP address for
 * each public subnet the cluster is in. A subnet can only exist in one availability zone.
 * Geth only supports advertising itself with one IP with the `--nat` flag.
 * Because a pod will be assigned to a node in a single availability zone, we
 * want geth to use the IP address that corresponds to the particular availability zone
 * the pod is scheduled in.
*/}}
{{- define "celo-fullnode.aws-subnet-specific-nat-ip" -}}
{{- if .Values.aws -}}
IP_TO_USE=
SUBNET_CIDR=
SUBNET_CIDRS={{ join "," .Values.geth.aws.all_subnet_cidr_blocks }}
IP_ADDRESSES_PER_NODE={{ join "-" .Values.geth.aws.ip_addresses_per_subnet_per_node }}
INDEX=0
# We have the CIDR blocks of all subnets, and an array of public IP addresses
# for each full node that correspond to each subnet. We aim to use the pod IP
# address to figure out which subnet CIDR blocks it belongs to, and use this
# information to set the `--nat` flag to use an IP address that is being used by
# the pod's network load balancer that lives in the same AZ this pod lives in.
while [ $INDEX -lt {{ len .Values.geth.aws.all_subnet_cidr_blocks }} -a -z $IP_TO_USE ]; do
  SUBNET_CIDR=$(echo $SUBNET_CIDRS | cut -d ',' -f $((INDEX + 1)))
  NETMASK=$(ipcalc -m $SUBNET_CIDR | grep -Eow '[0-9.]+')
  NETWORK=$(ipcalc -n $POD_IP $NETMASK | grep -Eow '[0-9.]+')
  echo "NETMASK $NETMASK NETWORK $NETWORK SUBNET_CIDR $SUBNET_CIDR POD_IP $POD_IP"
  SUBNET_NETWORK=$(echo $SUBNET_CIDR | cut -d '/' -f 1)
  if [ $NETWORK = $SUBNET_NETWORK ]; then
    IP_ADDRESSES_FOR_THIS_NODE=$(echo $IP_ADDRESSES_PER_NODE | cut -d '-' -f $((RID + 1)))
    IP_TO_USE=$(echo $IP_ADDRESSES_FOR_THIS_NODE | cut -d ',' -f $((INDEX + 1)))
  fi
  INDEX=$((INDEX + 1))
done
echo "Using IP $IP_TO_USE from subnet $SUBNET_CIDR"
NAT_FLAG="--nat=extip:${IP_TO_USE}"
{{- end -}}
{{- end -}}
