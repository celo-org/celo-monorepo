{{- define "name" -}}
{{- .Values.environment.name -}}-{{- .Values.environment.currencyPair | lower -}}-oracle-rbac-{{- .index -}}
{{- end -}}

{{- define "secret-name" -}}
{{- .Values.environment.name -}}-{{- .Values.environment.currencyPair | lower -}}-oracle-rbac-secret-{{- .index -}}
{{- end -}}

{{- define "oracle-pod-name" -}}
{{- .Values.environment.name -}}-{{- .Values.environment.currencyPair | lower -}}-oracle-{{- .index -}}
{{- end -}}
