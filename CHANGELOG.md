# Changelog

## 0.1.3

- Package metadata: the author's contact email.

## 0.1.2

- README: manual installation from a package file, and the setting n8n needs for packages that are not verified yet.

## 0.1.1

- The package no longer carries build leftovers (`tsconfig.tsbuildinfo`, source maps): only what n8n runs.

## 0.1.0

First version.

- Credential: ORYKSA API key, tested against `GET /v1/account`.
- ORYKSA node: Message a Model, Assistant (Ask, Do, Approve), Customer Agent (Send Message), Knowledge (Get Status, Add FAQ, Learn Website), Conversation (Get, Get Many).
- ORYKSA node: Image (Create), Audio (Transcribe, with the time of every word; Generate Speech).
- Every request says which workflow it comes from, so the ORYKSA usage statement shows it under n8n, by workflow.
- ORYKSA Trigger node: registers a webhook in ORYKSA when the workflow is activated, removes it when deactivated, and checks the signature of every event.
