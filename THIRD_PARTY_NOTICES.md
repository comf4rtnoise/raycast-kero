# Third-party resources

## Kero

- Upstream: <https://github.com/egoist/kero>
- Source revision: `09eb1d42dfe24c8ffc07600024e152e096532519` (Kero 2.1.35)
- License: MIT, copyright (c) 2026 EGOIST. Full text: [`assets/licenses/Kero-MIT.txt`](assets/licenses/Kero-MIT.txt).
- `assets/extension-icon.png` is derived from upstream `resources/icon.png`, resized from 1024 × 1024 to 512 × 512 with macOS `sips`. No artwork or colors were changed.
- Original PNG SHA-256: `45fdbdfbe07e213a97cf0e2e71830cf37cbea174da8bfb1877ffa385001bdfc4`.

To reproduce the extension icon from a checkout of this revision:

```bash
sips -z 512 512 /path/to/kero/resources/icon.png --out assets/extension-icon.png
```

Kero's name and artwork identify the application this extension integrates with; their use does not imply endorsement by the Kero author.

## Interface and program icons

The SVG files in `assets/kero/` are copied **byte-for-byte** from the `icons/` directory of the Kero revision above. Only assets used by this extension are included. Their original third-party licenses apply separately from Kero's MIT license:

| Bundled files         | Original source                                                      | License                                                                                       |
| --------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `f7-*.svg`            | [Framework7 Icons](https://github.com/framework7io/framework7-icons) | MIT, copyright (c) 2016 Vladimir Kharlampidi; [full text](assets/licenses/Framework7-MIT.txt) |
| `meteor-terminal.svg` | [Meteor Icons](https://github.com/zkreations/icons)                  | MIT, copyright (c) 2022 zkreations; [full text](assets/licenses/Meteor-MIT.txt)               |
| `si-*.svg`            | [Simple Icons](https://github.com/simple-icons/simple-icons)         | [CC0 1.0 Universal](assets/licenses/Simple-Icons-CC0.txt)                                     |

Upstream Kero documents these sources in [`icons/README.md`](https://github.com/egoist/kero/blob/09eb1d42dfe24c8ffc07600024e152e096532519/icons/README.md). The full license texts were retrieved from each original source's GitHub license endpoint. Program logos remain the trademarks of their respective owners; the icons identify the software running in a pane and do not imply endorsement.

`src/lib/icons.ts` adapts the program-name mapping, selection order (browser, then agent → process → runtime → terminal), and Claude/Gemini brand colors from Kero's [`icons.go`](https://github.com/egoist/kero/blob/09eb1d42dfe24c8ffc07600024e152e096532519/icons.go), under the [Kero MIT license](assets/licenses/Kero-MIT.txt). SVGs are tinted by Raycast at runtime: agent brand colors are retained; Raycast's dynamic text colors replace Kero's theme-specific neutral colors. Status tags retain Raycast's semantic colors. Native Raycast warning icons are retained where no corresponding Kero asset is used.

No runtime access to a Kero source checkout is required. To update these resources, copy only the referenced SVGs from the new Kero revision, review its licenses and `icons.go` mapping, update the revision recorded here, and run `npm test` and `npm run build`.

## Fonts

Kero bundles JetBrains Mono Nerd Font under the SIL Open Font License. These font files are **not redistributed** here: Raycast's native list UI has no custom font-family interface, so this extension uses Raycast's native typography rather than shipping unused fonts.
