# Keyword Tools

Dependency-free Node.js CLI for standardising keyword links in Midnight University articles.

## Commands

```bash
npm run kw:test                                        # run all tests
npm run kw:audit                                       # health report (read-only)
npm run kw:rename                                      # dry-run link rename
node tools/keywords/cli.mjs rename-links --write      # apply renames
npm run kw:stubs                                       # dry-run stub creation
node tools/keywords/cli.mjs stubs --write             # create English stubs
npm run kw:autolink -- --file 0043                    # dry-run one article
node tools/keywords/cli.mjs autolink --write          # link all articles
```

## Flags
`--write` applies changes · `--file <id>` single article · `--density <n>` chars/link (0=off)  
`--all-occurrences` · `--include-generic` · `--link-in-emphasis`

Reports are written to `tools/keywords/reports/` and are never deleted by the tool.
