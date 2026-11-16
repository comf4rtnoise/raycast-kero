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

## Fonts

Kero bundles JetBrains Mono Nerd Font under the SIL Open Font License. These font files are **not redistributed** here: Raycast's native list UI has no custom font-family interface, so this extension uses Raycast's native typography rather than shipping unused fonts.
