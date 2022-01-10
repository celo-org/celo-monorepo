{{- /*
Defines common labels across all blockscout components.
*/ -}}
{{- define "celo.blockscout.labels" -}}
app: blockscout
chart: blockscout
release: {{ .Release.Name }}
heritage: {{ .Release.Service }}
{{- end -}}

{{- /*
Defines common annotations across all blockscout components.
*/ -}}
{{- define "celo.blockscout.annotations" -}}
kubernetes.io/change-cause: {{ .Values.changeCause }}
{{- end -}}

{{- /*
Defines the CloudSQL proxy container that terminates
after termination of the main container.
Should be included as the last container as it contains
the `volumes` section.
*/ -}}
{{- define "celo.blockscout.container.db-terminating-sidecar" -}}
- name: cloudsql-proxy
  image: gcr.io/cloudsql-docker/gce-proxy:1.11
  command:
  - /bin/sh
  args:
  - -c
  - |
    /cloud_sql_proxy \
    -instances={{ .Database.connectionName }}=tcp:{{ .Database.port }} \
    -credential_file=/secrets/cloudsql/credentials.json &
    CHILD_PID=$!
    (while true; do if [[ -f "/tmp/pod/main-terminated" ]]; then kill $CHILD_PID; fi; sleep 1; done) &
    wait $CHILD_PID
    if [[ -f "/tmp/pod/main-terminated" ]]; then exit 0; fi
  securityContext:
    runAsUser: 2  # non-root user
    allowPrivilegeEscalation: false
  volumeMounts:
  - name: blockscout-cloudsql-credentials
    mountPath: /secrets/cloudsql
    readOnly: true
  - mountPath: /tmp/pod
    name: temporary-dir
    readOnly: true
{{- end -}}

{{- /* Defines the volume with CloudSQL proxy credentials file. */ -}}
{{- define "celo.blockscout.volume.cloudsql-credentials" -}}
- name: blockscout-cloudsql-credentials
  secret:
    defaultMode: 420
    secretName: blockscout-cloudsql-credentials
{{- end -}}

{{- /* Defines an empty dir volume with write access for temporary pid files. */ -}}
{{- define "celo.blockscout.volume.temporary-dir" -}}
- name: temporary-dir
  emptyDir: {}
{{- end -}}

{{- /* Defines init container copying secrets-init to the specified directory. */ -}}
{{- define "celo.blockscout.initContainer.secrets-init" -}}
- name: secrets-init
  image: "doitintl/secrets-init:0.4.2"
  args:
    - copy
    - /secrets/
  volumeMounts:
  - mountPath: /secrets
    name: temporary-dir
{{- end -}}

{{- /*
Defines the CloudSQL proxy container that provides
access to the database to the main container.
Should be included as the last container as it contains
the `volumes` section.
*/ -}}
{{- define "celo.blockscout.container.db-sidecar" -}}
- name: cloudsql-proxy
  image: gcr.io/cloudsql-docker/gce-proxy:1.19.1
  command: ["/cloud_sql_proxy",
            "-instances={{ .Database.connectionName }}=tcp:{{ .Database.port }}",
            "-credential_file=/secrets/cloudsql/credentials.json",
            "-term_timeout=30s"]
  {{- if .Database.proxy.livenessProbe.enabled }}
  livenessProbe:
    tcpSocket:
      port: {{ .Database.proxy.port }}
    initialDelaySeconds: {{ .Database.proxy.livenessProbe.initialDelaySeconds }}
    periodSeconds: {{ .Database.proxy.livenessProbe.periodSeconds }}
    timeoutSeconds: {{ .Database.proxy.livenessProbe.timeoutSeconds }}
    successThreshold: {{ .Database.proxy.livenessProbe.successThreshold }}
    failureThreshold: {{ .Database.proxy.livenessProbe.failureThreshold }}
  {{- end }}
  {{- if .Database.proxy.readinessProbe.enabled }}
  readinessProbe:
    tcpSocket:
      port: {{ .Database.proxy.port }}
    initialDelaySeconds: {{ .Database.proxy.readinessProbe.initialDelaySeconds }}
    periodSeconds: {{ .Database.proxy.readinessProbe.periodSeconds }}
    timeoutSeconds: {{ .Database.proxy.readinessProbe.timeoutSeconds }}
    successThreshold: {{ .Database.proxy.readinessProbe.successThreshold }}
    failureThreshold: {{ .Database.proxy.readinessProbe.failureThreshold }}
  {{- end }}
  resources:
    requests:
      memory: {{ .Database.proxy.resources.requests.memory }}
      cpu: {{ .Database.proxy.resources.requests.cpu }}
  securityContext:
    runAsUser: 2  # non-root user
    allowPrivilegeEscalation: false
  volumeMounts:
    - name: blockscout-cloudsql-credentials
      mountPath: /secrets/cloudsql
      readOnly: true
{{- end -}}

{{- /*
Defines shared environment variables for all
blockscout components.
*/ -}}
{{- define "celo.blockscout.env-vars" -}}
- name: DATABASE_USER
  value: {{ .Values.blockscout.secrets.dbUser }}
- name: DATABASE_PASSWORD
  value: {{ .Values.blockscout.secrets.dbPassword }}
- name: NETWORK
  value: Celo
- name: SUBNETWORK
  value: {{ .Values.blockscout.chain.subnetwork }}
- name: COIN
  value: CELO
- name: ECTO_USE_SSL
  value: "false"
- name: ETHEREUM_JSONRPC_VARIANT
  value: geth
- name: ETHEREUM_JSONRPC_HTTP_URL
  value: {{ .Values.blockscout.archiveNodes.jsonrpcHttpUrl }}
- name: ETHEREUM_JSONRPC_WS_URL
  value: {{ .Values.blockscout.archiveNodes.jsonrpcWsUrl }}
- name: PGUSER
  value: {{ .Values.blockscout.secrets.dbUser }}
- name: DATABASE_URL
  value: {{ .Values.blockscout.secrets.dbUrl }}
- name: DATABASE_DB
  value: {{ .Database.name }}
- name: DATABASE_HOSTNAME
  value: {{ .Database.proxy.host | quote }}
- name: DATABASE_PORT
  value: {{ .Database.proxy.port | quote }}
- name: WOBSERVER_ENABLED
  value: "false"
- name: HEALTHY_BLOCKS_PERIOD
  value: {{ .Values.blockscout.healthyBlocksPeriod | quote }}
- name: MIX_ENV
  value: prod
- name: LOGO
  value: /images/celo_logo.svg
- name: BLOCKSCOUT_VERSION
  value: {{ .Values.blockscout.image.tag }}
{{- end -}}
