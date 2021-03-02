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
kubernetes.io/change-cause: Deployed {{ .Values.blockscout.image.tag }} by {{ .Values.blockscout.deployment.account }}
{{- end -}}

{{- /*
Defines the CloudSQL proxy container that terminates
after termination of the main container.
Should be included as the last container as it contains
the `volumes` section.
*/ -}}
{{- define "celo.blockscout-db-terminating-sidecar" -}}
- name: cloudsql-proxy
  image: gcr.io/cloudsql-docker/gce-proxy:1.11
  command:
  - /bin/sh
  args:
  - -c
  - |
    /cloud_sql_proxy \
    -instances={{ .Values.blockscout.db.connection_name }}=tcp:5432 \
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
    name: tmp-pod
    readOnly: true
volumes:
  - name: blockscout-cloudsql-credentials
    secret:
      defaultMode: 420
      secretName: blockscout-cloudsql-credentials
  - name: tmp-pod
    emptyDir: {}
{{- end -}}

{{- /*
Defines the CloudSQL proxy container that provides
access to the database to the main container.
Should be included as the last container as it contains
the `volumes` section.
*/ -}}
{{- define "celo.blockscout-db-sidecar" -}}
- name: cloudsql-proxy
  image: gcr.io/cloudsql-docker/gce-proxy:1.16
  command: ["/cloud_sql_proxy",
            "-instances={{ .Values.blockscout.db.connection_name }}{{ .DbSuffix | default "" }}=tcp:5432",
            "-credential_file=/secrets/cloudsql/credentials.json",
            "-term_timeout=30s"]
  resources:
    requests:
      memory: 500Mi
      cpu: 200m
  securityContext:
    runAsUser: 2  # non-root user
    allowPrivilegeEscalation: false
  volumeMounts:
    - name: blockscout-cloudsql-credentials
      mountPath: /secrets/cloudsql
      readOnly: true
volumes:
  - name: blockscout-cloudsql-credentials
    secret:
      secretName: blockscout-cloudsql-credentials
{{- end -}}

{{- /*
Defines shared environment variables for all
blockscout components.
*/ -}}
{{- define "celo.blockscout-env-vars" -}}
- name: DATABASE_USER
  valueFrom:
    secretKeyRef:
      name:  {{ .Release.Name }}
      key: DATABASE_USER
- name: DATABASE_PASSWORD
  valueFrom:
    secretKeyRef:
      name:  {{ .Release.Name }}
      key: DATABASE_PASSWORD
- name: NETWORK
  value: Celo
- name: SUBNETWORK
  value: {{ .Values.blockscout.subnetwork }}
- name: COIN
  value: cGLD
- name: SEGMENT_KEY
  value: {{ .Values.blockscout.segment_key }}
- name: ECTO_USE_SSL
  value: "false"
- name: ETHEREUM_JSONRPC_VARIANT
  value: geth
- name: ETHEREUM_JSONRPC_HTTP_URL
  value: {{ .Values.blockscout.jsonrpc_http_url }}
- name: ETHEREUM_JSONRPC_WS_URL
  value: {{ .Values.blockscout.jsonrpc_ws_url }}
- name: DATABASE_URL
  value: postgres://$(DATABASE_USER):$(DATABASE_PASSWORD)@127.0.0.1:5432/{{ .Values.blockscout.db.name }}
- name: DATABASE_DB
  value: {{ .Values.blockscout.db.name }}
- name: DATABASE_HOSTNAME
  value: "127.0.0.1"
- name: DATABASE_PORT
  value: "5432"
- name: WOBSERVER_ENABLED
  value: "false"
- name: HEALTHY_BLOCKS_PERIOD
  value: {{ .Values.blockscout.healthy_blocks_period | quote }}
- name: MIX_ENV
  value: prod
- name: LOGO
  value: /images/celo_logo.svg
- name: BLOCKSCOUT_VERSION
  value: {{ .Values.blockscout.image.tag }}
{{- end -}}
