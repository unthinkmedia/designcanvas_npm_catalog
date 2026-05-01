---
name: design-guidance
description: >
  Fetch design guidance and component documentation from the authenticated Storybook instance
  at brave-field-0ab65a210.6.azurestaticapps.net. Use this skill whenever the user asks about
  design language, component patterns, design tokens, typography, spacing, color guidance, or
  wants to reference the design system docs before building a new component. Also use when the
  user says "check the design docs", "what does the design system say about X", "fetch design
  guidance for X", or is building/reviewing UI components and needs design reference. This
  skill requires Edge with an existing Microsoft Entra ID session for authentication.
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Design Guidance Fetcher

Fetches design documentation from the authenticated Storybook instance for use as reference
when designing or building UI components.

## Storybook URL

The design system Storybook is hosted at:
```
https://brave-field-0ab65a210.6.azurestaticapps.net
```

The main design language docs entry point is:
```
https://brave-field-0ab65a210.6.azurestaticapps.net/?path=/docs/design-language-content--docs
```

## Authentication Strategy

This Storybook is behind Microsoft Entra ID. Direct browser automation login is not feasible.
Instead, connect to an existing Edge session that already has valid Entra ID cookies.

### Step 1: Launch Edge with Remote Debugging

If Edge is not already running with remote debugging, launch it with the user's existing
profile so that Entra ID session cookies are available:

```bash
# Close Edge first if running without debugging port
# Then relaunch with CDP enabled on port 9222
open -a "Microsoft Edge" --args --remote-debugging-port=9222
```

Wait a few seconds for Edge to start, then verify it's listening:
```bash
curl -s http://localhost:9222/json/version | head -5
```

If the user has never logged into the Storybook before, ask them to manually visit the URL
in Edge and complete the Entra ID sign-in flow first. The cookies will persist for subsequent
automated access.

### Step 2: Connect agent-browser via CDP

```bash
agent-browser --cdp 9222 open "https://brave-field-0ab65a210.6.azurestaticapps.net/?path=/docs/design-language-content--docs"
agent-browser --cdp 9222 wait --load networkidle
```

If the page redirects to a login page (check URL contains `login.microsoftonline.com`):
```bash
agent-browser --cdp 9222 get url
```
Tell the user: "The Entra ID session has expired. Please sign in manually in Edge, then
I'll retry."

### Step 3: Extract Content

Once authenticated and on the Storybook page:

```bash
# Take a snapshot to see available navigation and content
agent-browser --cdp 9222 snapshot -i

# Get the rendered docs content
agent-browser --cdp 9222 get text "#storybook-docs" > /tmp/design-guidance.txt

# If #storybook-docs doesn't exist, try the iframe approach (Storybook renders docs in iframe)
agent-browser --cdp 9222 eval "document.querySelector('#storybook-preview-iframe')?.contentDocument?.querySelector('#storybook-docs')?.innerText || 'not found'"

# Screenshot for visual reference
agent-browser --cdp 9222 screenshot --full /tmp/design-guidance.png
```

## Navigating Storybook Sections

The Storybook sidebar has multiple sections. To navigate to a specific topic:

```bash
# Snapshot the sidebar to find navigation items
agent-browser --cdp 9222 snapshot -i -s "[class*='sidebar']"

# Click on the relevant section (use refs from snapshot)
agent-browser --cdp 9222 click @eN

# Wait for content to load, then extract
agent-browser --cdp 9222 wait --load networkidle
agent-browser --cdp 9222 get text "#storybook-docs"
```

You can also navigate directly by URL path. Storybook uses `?path=/docs/<story-id>--docs` format:
```bash
agent-browser --cdp 9222 open "https://brave-field-0ab65a210.6.azurestaticapps.net/?path=/docs/<story-id>--docs"
```

## Usage Patterns

### Fetch guidance for a specific topic

When the user asks about a design topic (e.g., "what are the color guidelines?"):

1. Connect to Edge via CDP
2. Open the Storybook docs index page
3. Snapshot the sidebar to find relevant sections
4. Navigate to the matching section
5. Extract the text content
6. Summarize the key guidance points back to the user

### Pre-build reference check

Before building a new component:

1. Fetch the design language overview
2. Look for any component-specific docs in the sidebar
3. Extract relevant tokens, spacing, color, and typography guidance
4. Use the guidance to inform implementation decisions

### Screenshot for visual reference

When text extraction isn't enough:

```bash
agent-browser --cdp 9222 screenshot --full /tmp/design-ref.png
agent-browser --cdp 9222 screenshot -s "#storybook-docs" /tmp/design-content.png
```

## Important Notes

- Always use `--cdp 9222` to connect to the existing Edge instance — never launch a new browser
- The Entra ID session typically lasts several hours; if it expires, the user must re-authenticate manually in Edge
- If Edge isn't running with `--remote-debugging-port=9222`, you need to relaunch it (this preserves the user's profile and cookies)
- Storybook content is inside an iframe — you may need to access the iframe's document for text extraction
- Close the agent-browser connection when done, but do NOT close Edge itself
