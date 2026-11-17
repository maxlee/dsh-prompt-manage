# Changelog

All notable changes to this project are documented in this file.

## 0.2.0

Released on 2026-11-17.

- Add a prompt history chip immediately left of the model selector in the composer; clicking it opens a searchable palette above the input.
- Apply inserts the selected prompt into the composer: an empty draft is replaced (multi-line prompts become real paragraphs), while an existing draft keeps its caret and gets padded so two prompts never glue together.
- The palette searches prompt text, project names, and session titles across every conversation, opens above the composer at the composer's width, and reuses one 30-second index cache.
- Keyboard and pointer behavior: Up/Down walk results, Enter/Tab apply, Escape and outside clicks dismiss, the chip's tooltip names the action, and Apply disables while a message is sending.
- Focus returns to the composer after applying or dismissing through the session input facade.
- Open the full prompt history page from the palette footer through the layout service.
- Rename the package to `dsh-prompt-manage` so the project, repository, and package names match.
- Add a smoke test that keeps the client bundle id and the Cordis patch row aligned with the package name, plus MIT license, changelog, and release documentation.
