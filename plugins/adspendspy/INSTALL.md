# Installing the AdSpendSpy plugin

One plugin folder (`plugins/adspendspy/`) serves Claude Code and Codex. Each agent reads its own
manifest:

| File | Read by |
|---|---|
| `.claude-plugin/marketplace.json` (repo root) | Claude Code marketplace |
| `plugins/adspendspy/.claude-plugin/plugin.json` + `.mcp.json` | Claude Code plugin + MCP servers |
| `.agents/plugins/marketplace.json` (repo root) | Codex marketplace |
| `plugins/adspendspy/.codex-plugin/plugin.json` + `.codex-mcp.json` | Codex plugin + MCP servers |
| `plugins/adspendspy/skills/rebuild-landing-page/` | Skill, shared by both |

## 1. API key

```bash
export ADSPENDSPY_API_KEY=asp_live_...
```

Create the key at [adspendspy.com/settings.php](https://www.adspendspy.com/settings.php)
(Account Settings → API Keys). It is sent only as the `X-API-Key` header, never as
`Authorization`. Without a key only the public demo server (`adspendspy-demo`, Alex Hormozi only)
works; the account server `adspendspy` shows as failed or returns `401`.

## 2. Claude Code

```text
/plugin marketplace add adspendspy/meta-ad-library-spend-api
/plugin install adspendspy@adspendspy
```

Restart Claude Code after setting `ADSPENDSPY_API_KEY`. The MCP config uses `${ADSPENDSPY_API_KEY}`
expansion in the `X-API-Key` header. Claude Code lists the MCP prompts as slash commands
(`/mcp__adspendspy__rebuild_landing_page`, `/mcp__adspendspy__landing_page_teardown`).

## 3. Codex

```bash
codex plugin marketplace add adspendspy/meta-ad-library-spend-api
codex plugin add adspendspy@adspendspy
```

Alternatively run `codex`, open `/plugins` and install AdSpendSpy from the browser.

Verified facts and their sources (checked 2026-10-05, Codex CLI 0.160.0):

- **Adding a marketplace from GitHub** — `codex plugin marketplace add owner/repo` (also
  `--ref main`, `--sparse .agents/plugins`; manage with `codex plugin marketplace list|upgrade|remove`).
  Source: https://developers.openai.com/codex/plugins/build (served at
  https://developers.openai.com/plugins/build/package).
- **Installing a plugin** — `codex plugin add <PLUGIN[@MARKETPLACE]>` ("Install a plugin from a
  configured or remote marketplace. Pass either `PLUGIN@MARKETPLACE` or pass `PLUGIN` with
  `--marketplace MARKETPLACE`"). Source: `codex plugin add --help`, Codex CLI 0.160.0. The docs
  describe installing via the `/plugins` browser: https://developers.openai.com/codex/plugins
  (redirects to https://learn.chatgpt.com/docs/plugins).
- **Marketplace location and format** — `$REPO_ROOT/.agents/plugins/marketplace.json` with `name`,
  `interface.displayName` and `plugins[]` entries carrying `name`, `source {source, path}`,
  `policy {installation, authentication}` and `category`. Codex also reads a legacy-compatible
  `$REPO_ROOT/.claude-plugin/marketplace.json`. Source: https://developers.openai.com/codex/plugins/build
- **Plugin manifest** — `.codex-plugin/plugin.json` supports `skills` (e.g. `"./skills/"`),
  `mcpServers` and `interface` (`displayName`, `shortDescription`, `longDescription`,
  `developerName`, `category`, `capabilities`, `websiteURL`, `privacyPolicyURL`,
  `termsOfServiceURL`, `defaultPrompt`, `brandColor`, `composerIcon`, `logo`, `screenshots`).
  The docs show PNG paths such as `./assets/logo.png`; no file type is restricted. Source:
  https://developers.openai.com/codex/plugins/build
- **HTTP MCP server with a header from an environment variable** — streamable HTTP servers take
  `url` plus optional `bearer_token_env_var`, `http_headers` (static values) and
  `env_http_headers` ("Map of header names to environment variable names (values pulled from the
  environment)"). `.codex-mcp.json` therefore uses
  `"env_http_headers": {"X-API-Key": "ADSPENDSPY_API_KEY"}` — not `bearer_token_env_var`, which
  would send `Authorization`. Source: https://developers.openai.com/codex/mcp (redirects to
  https://learn.chatgpt.com/docs/extend/mcp?surface=cli). The JSON shape (`"type": "http"` with
  config keys in the server entry) follows OpenAI's own bundled GitHub plugin `.mcp.json`
  (`"type": "http"`, `"bearer_token_env_var"`) shipped with Codex CLI 0.160.0.
- **MCP prompts** — the Codex MCP documentation describes tools and the server `instructions`
  field only ("Codex reads the MCP `instructions` field returned during initialization and uses it
  as server-wide guidance alongside the server's tools"); it does not document showing MCP
  prompts. In Codex, use the bundled `rebuild-landing-page` skill instead — it covers the same
  workflow. Source: https://developers.openai.com/codex/mcp

## 4. claude.ai (skill only)

```bash
node scripts/package-skill.mjs
```

This writes `dist/rebuild-landing-page.zip` with the skill folder at the top level. Upload it on
claude.ai under Settings → Capabilities → Skills. Connect the MCP server separately as a custom
connector (`https://www.adspendspy.com/mcp-demo` works without a key).
