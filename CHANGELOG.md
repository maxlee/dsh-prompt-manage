# Changelog

All notable changes to this project are documented in this file.

## 0.4.0

Released on 2026-11-19.

- Rename the visible product to **Prompt Manage** / **提示词管理** everywhere the sidebar and page title show it; the package id stays `dsh-prompt-manage`.
- Make the history index scale to thousands of prompts: warm the index at activation, keep parsed per-session results in a bounded LRU cache, revalidate unchanged payloads with a stable ETag, and serve stale-while-revalidate between scans. The response budget rises to 10,000 prompts / 4,000,000 characters.
- Speed up search by preparing lowercased prompt and metadata text once per index, replacing the per-keystroke character loop with native `indexOf` fuzzy matching over the full prompt, and deferring the filter pass so typing stays responsive with thousands of long prompts.
- Search now explicitly treats whitespace-separated words as an AND query: `react 登录` matches only prompts containing both terms, in any order, across prompt text, project, and session title; matching terms are highlighted when they fall inside the preview window.
- Render the sidebar list in 100-row pages with a **Show more** button and `content-visibility` for off-screen rows; the composer palette stays capped at 60 results.
- Add a mock-data screenshot of the composer palette search for the README; every prompt, project, and session visible in it is synthetic.

## 0.3.2

Released on 2026-11-19.

- Keep the composer prompt palette inside the viewport on short windows: its height now follows the room above the composer instead of forcing a minimum that clipped the search row.
- Place the caret at the end of the draft after applying a history prompt (including command mode) and after optimizing a prompt.
- Replace the composer history and optimizer glyphs with a clock-history icon and a magic-wand icon (ISC-licensed Lucide geometry), and refresh the README and plugin metadata descriptions accordingly.

## 0.3.1

Released on 2026-11-18.

- Fix the composer command mode (`/goal`, `/plan`, and other slash commands): the prompt history **Apply** action and the **Optimize prompt** chip now stay usable while a command chip is active.
- Applying a history prompt in command mode appends it after the command instead of replacing the leading slash command; optimizing reads and replaces only the command's argument text while preserving the command chip.

## 0.3.0

Released on 2026-11-18.

- Add a sparkle **Optimize prompt** chip immediately left of the prompt history chip in the composer. It sends the current draft through the session's selected model with the editable system prompt in `prompts/prompt-optimizer.system.md` and replaces the draft with the model's `<optimized_prompt>` block.
- The optimizer reads the system prompt from disk on every request so future tuning only needs a file edit; add its host service, POST route, timeout, input limit, error codes, and a success toast with **Undo**.
- Keep the history palette, sidebar page, and all existing copy unchanged; the optimizer shares the composer tool row and theme tokens.

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
