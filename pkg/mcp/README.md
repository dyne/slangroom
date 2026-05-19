# @slangroom/mcp

Model Context Protocol (MCP) server for Slangroom contract development assistance.

## Overview

This package provides an MCP server that helps developers and AI assistants write Slangroom contracts by providing:

- Slangroom contract templates
- Zencode keyword autocomplete suggestions
- Documentation for Slangroom plugins
- Contract validation
- Test data generation

## Features

- Context-aware assistance for Slangroom contract development
- Integration with AI coding assistants via MCP
- Resource provider for Slangroom and Zencode documentation
- Tool definitions for common Slangroom operations

## Installation

```bash
pnpm add @slangroom/mcp
```

## Usage

The MCP server is designed to be used with AI coding assistants that support the
Model Context Protocol. It speaks the **stdio** transport and ships a
`slangroom-mcp` binary (entrypoint: `build/esm/src/cli.js`).

## Add to Claude Code

First build the package — the server runs from the build output:

```bash
pnpm --filter @slangroom/mcp build
```

### Option A — `claude mcp add` (CLI)

Project scope (writes a shared `.mcp.json` in the repo root):

```bash
claude mcp add slangroom --scope project -- node ./pkg/mcp/build/esm/src/cli.js
```

User scope (available in every project, stored in `~/.claude.json`):

```bash
claude mcp add slangroom --scope user -- node /absolute/path/to/pkg/mcp/build/esm/src/cli.js
```

If you manage the toolchain with `mise`, wrap the command so the right Node is used:

```bash
claude mcp add slangroom --scope project -- mise exec -- node ./pkg/mcp/build/esm/src/cli.js
```

### Option B — edit `.mcp.json` manually

Create or edit `.mcp.json` in the repository root:

```json
{
  "mcpServers": {
    "slangroom": {
      "type": "stdio",
      "command": "mise",
      "args": ["exec", "--", "node", "./pkg/mcp/build/esm/src/cli.js"],
      "env": {}
    }
  }
}
```

Drop the `mise exec --` wrapper (use `"command": "node"`) if you are not using `mise`.

### Enable and verify

Project-scoped servers from `.mcp.json` are disabled until you trust them. On first
launch Claude Code prompts to approve the server; alternatively add it to
`.claude/settings.local.json`:

```json
{
  "enabledMcpjsonServers": ["slangroom"],
  "enableAllProjectMcpServers": true
}
```

Then confirm the connection:

```bash
claude mcp list          # shows "slangroom" and its status
claude mcp get slangroom # shows the resolved command/args
```

Inside a Claude Code session, run `/mcp` to inspect the server, or just ask the
assistant to use the `list_statements`, `search_contract_sources`,
`draft_contract`, and `validate_contract` tools.

## Development

To build the package:

```bash
pnpm build
```

To run tests:

```bash
pnpm test
```