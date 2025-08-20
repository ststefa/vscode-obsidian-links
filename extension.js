// @ts-check
const vscode = require("vscode");

// --- Regex for obsidian:// URIs in Markdown ---
// Matches obsidian://... up to whitespace or closing ) ] >
const OBSIDIAN_LINK_RE = /obsidian:\/\/[^\s)\]>"]+/gi;

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  console.log("[obsidian-links] activate; activationEvents:", context.extension.packageJSON.activationEvents);

  // 1) Open obsidian:// using OS
  const openCmd = vscode.commands.registerCommand(
    "vscode-obsidian-links.openLink",
    async (arg) => {
      try {
        const href = typeof arg === "string" ? arg : arg?.href || arg?.toString();
        if (!href || !href.startsWith("obsidian://")) {
          vscode.window.showErrorMessage("[obsidian-links] Not an obsidian:// URL.");
          return;
        }
        console.log("[obsidian-links] openExternal ->", href);
        const ok = await vscode.env.openExternal(vscode.Uri.parse(href));
        if (!ok) vscode.window.showWarningMessage("[obsidian-links] OS refused to open the URI.");
      } catch (e) {
        console.error("[obsidian-links] open failed:", e);
        vscode.window.showErrorMessage(`[obsidian-links] Failed to open: ${e}`);
      }
    }
  );
  context.subscriptions.push(openCmd);

  // 2) Editor: turn obsidian://… into clickable links
  const provider = /** @type {vscode.DocumentLinkProvider} */ ({
    provideDocumentLinks(document) {
      const text = document.getText();
      const links = [];
      let m;
      while ((m = OBSIDIAN_LINK_RE.exec(text)) !== null) {
        const start = document.positionAt(m.index);
        const end = document.positionAt(m.index + m[0].length);
        const arg = encodeURIComponent(JSON.stringify({ href: m[0] }));
        const commandUri = vscode.Uri.parse(`command:vscode-obsidian-links.openLink?${arg}`);
        const dl = new vscode.DocumentLink(new vscode.Range(start, end), commandUri);
        dl.tooltip = "Open in Obsidian";
        links.push(dl);
      }
      return links;
    },
  });
  context.subscriptions.push(vscode.languages.registerDocumentLinkProvider({ language: "markdown" }, provider));

  // 3) PREVIEW: Use vscode://<extensionId>/open?href=... via UriHandler
  const extensionId = context.extension.id; // e.g. "StefanSteinert.vscode-obsidian-links"

  // Handle vscode://<extensionId>/open?href=...
  const uriHandler = vscode.window.registerUriHandler({
    async handleUri(uri) {
      try {
        if (uri.authority !== extensionId.split(".").pop()) {
          // Some VS Code builds pass authority as only the last segment; be liberal:
          // We'll read query param regardless.
        }
        const params = new URLSearchParams(uri.query);
        let hrefb64 = params.get("href_b64");
        if (hrefb64) {
          try {
            const buf = Buffer.from(hrefb64, 'base64');
            hrefb64 = buf.toString('utf8');
          } catch (e) {
            console.error('[obsidian-links] Failed to decode href_b64:', e);
            hrefb64 = '';
          }
        } else {
          hrefb64 = '';
        }
        console.log('[obsidian-links] (uriHandler) resolved href64 =', hrefb64);
        if (!hrefb64.startsWith('obsidian://')) {
          vscode.window.showErrorMessage('[obsidian-links] Missing or invalid href_b64 param.');
          return;
        }
        console.log('[obsidian-links] (uriHandler) openExternal ->', hrefb64);
        await vscode.env.openExternal(vscode.Uri.parse(hrefb64));
      } catch (e) {
        console.error("[obsidian-links] uriHandler failed:", e);
        vscode.window.showErrorMessage(String(e));
      }
    },
  });
  context.subscriptions.push(uriHandler);

  // markdown-it plugin factory capturing extensionId
  function extendMarkdownIt(md) {
    console.log("[obsidian-links] markdown-it plugin active");
    /**
     * The original markdown-it link_open renderer, if present.
     * @type {(tokens: any[], idx: number, opts: any, env: any, self: any) => string}
     */
    const orig = md.renderer.rules.link_open || ((tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts));
    md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
      const aIndex = tokens[idx].attrIndex("href");
      if (aIndex >= 0) {
        const href = tokens[idx].attrs[aIndex][1];
        if (typeof href === "string" && href.startsWith("obsidian://")) {
          // Use base64 to preserve exact obsidian href without double-encoding
          let utf8Bytes = new TextEncoder().encode(href);
          let b64 = Buffer.from(utf8Bytes).toString("base64");
          let rewritten = `vscode://${extensionId}/open?href_b64=${b64}`
          // Debug log only in devtools of the webview:
          // console.log is fine; VS Code forwards it to Webview Developer Tools
          console.log("[obsidian-links] rewriting preview link ->", rewritten);
          tokens[idx].attrs[aIndex][1] = rewritten;
        }
      }
      return orig(tokens, idx, opts, env, self);
    };
    return md;
  }

  // IMPORTANT: return the plugin so VS Code wires it into the Preview
  return { extendMarkdownIt };
}

function deactivate() {}

module.exports = { activate, deactivate };