{{- define "name" -}}
{{- .Values.environment.name -}}-oracle-rbac-{{- .index -}}a
{{- end -}}
