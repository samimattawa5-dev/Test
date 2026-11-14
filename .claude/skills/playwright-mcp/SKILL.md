---
name: playwright-mcp
description: Control a real browser via Microsoft's Playwright MCP (@playwright/mcp) — open pages, click, type, screenshot, read console/network. Use when asked to test a website, automate browser actions, or check a page visually.
---

# Playwright MCP

Browser automation through `@playwright/mcp` (verified working, v1.66).

## Setup (once)

```bash
claude mcp add playwright -- npx @playwright/mcp@latest --headless --no-sandbox --executable-path /opt/pw-browsers/chromium
```

Locally (with a window) use instead: `claude mcp add playwright -- npx @playwright/mcp@latest`

Restart the session afterwards so the `browser_*` tools load.

## Useful options

- `--headless` no window
- `--browser firefox|webkit|chromium`
- `--device "iPhone 15"` mobile emulation
- `--isolated` fresh profile per session
- `--no-sandbox --executable-path /opt/pw-browsers/chromium` for this cloud container

## Main tools

`browser_navigate`, `browser_snapshot` (accessibility tree, preferred over screenshots), `browser_click`, `browser_type`, `browser_fill_form`, `browser_take_screenshot`, `browser_console_messages`, `browser_network_requests`, `browser_resize`, `browser_emulate_media`, `browser_handle_dialog`, `browser_close`.

## Workflow

1. `browser_navigate` to the URL.
2. `browser_snapshot` to get element refs.
3. Act (`click`/`type`/`fill_form`) using refs from the snapshot.
4. Re-snapshot to verify; check `browser_console_messages` for errors.
5. `browser_close` when done.

## Fallback without MCP

`require('playwright')` works directly in Node here; `chromium.launch()` needs no options.
