# VSCode Clickable Obsidian Links

I use VSCode and Obsidian a lot. Nothing beats plaintext. I mix and match documentation between the two extensively. Typically, my VSCode files contain the stuff that goes public, while Obsidian hosts the more meta stuff that doesn't.

One day, it annoyed me that I couldn't click on Obsidian links in my VSCode README's. This isn't possible because VSCode - for security reasons - only calls up certain schemas like "https://" or "vscode://". So I wrote this extension.

It makes `obsidian://` links clickable in Markdown documents as well as -previews. The extension intercepts the links and opens them using your operating system, so Obsidian handles them.

Sure, it's all plain textfiles, so there are other approaches to linking. One could e.g. put her Obsidian notes on github and just use http URLs. Valid approach. But I like Obsidian URLs (and especially [advanced URIs](https://publish.obsidian.md/advanced-uri-doc/Home)) for their ability to decouple links from the physical structure [using id's](https://publish.obsidian.md/advanced-uri-doc/Concepts/File+identifiers#Key+in+frontmatter). I.e., I don't want my links to break if I rename a file or move a repo.

On a side note, if you also want the opposite direction (that is, stable links in your Obsidian notes pointing to some local file), checkout [HookMark](https://hookproductivity.com).

## Usage

Using the extension couldn't be any simpler:

1. Install it.
1. Open a markdown file that contains some `obsidian://...` link.
1. As with any link, if you're in the source view, Cmd+Click it. If you're in the Preview, just click it.
1. You might be asked permission to open the link in this plugin. Say ok.
1. Obsidian should pop up, showing the link target.

## Troubleshooting

If it does not work, try opening the link using your OS. E.g. ...

... on a Mac terminal:

```sh
open 'obsidian://...'
```

... on a Windows PowerShell:

```sh
Start-Process 'obsidian://...'
```

This should open Obsidian because it should've installed a URL-handler for this schema. This mechanism is the prereq to use this plugin. If it does not work, something is wrong with your Obsidian installation.

If it does work, then there's likely some problem with this extension. I added some log statements in the code. You can see the output in the builtin developer tools (on a Mac: Help > Toggle Developer Tools, then select the "Console" tab). If you suspect a code problem, open an issue providing that information.
