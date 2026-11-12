# The Puzzle Maiden and the Story-Knight

An illustrated interactive fantasy book in the Midnight Trickster Tapestry style.

## Run locally

Open `index.html` in a browser. For best compatibility, serve this folder with a static server:

```bash
python -m http.server 8000
```

Visit http://localhost:8000. No build tooling is necessary.

## Deploy on GitHub Pages

Copy the contents of this folder to the `puzzle-maiden/` folder in `a-feraci/a-feraci.github.io` (which already hosts a user Pages site). The book will be located at `https://a-feraci.github.io/puzzle-maiden/` once GitHub Pages publishes the files. Leave existing root files untouched.

## Features

Cover/back cover, parchment spreads, contents navigation, illustrated chapters, four finale scenes in story order, characters and lore, page arrows and keyboard navigation, enlargeable full-size illustrations, adjustable text, shared page links, and locally saved reading progress.

The four finale images appear at their manuscript anchors in the order Clock, Transparent House, Moon-Bunny Piece, Open Road. Their full-size artwork was supplied by the author. The five chapter texts are preserved from the existing manuscript. Read-aloud is deferred.


## Reader update

The header and book fit the viewport. Navigation and progress overlay the binding; only the text, contents, or open dialog scroll. The gear opens saved preferences for text size (16–32 px), five font families, custom ink/paper colors, six palettes, music volume, and optional page-turn sound and animation. Day/night is also available from the header. Reduced-motion preferences suppress page curls.

Illustrated leaves fill the page without duplicate captions. Select any illustration for its uncropped view, then zoom from 100% to 400% and scroll to explore.

`assets/moonlit-garden.wav` is an original 53-second looping instrumental composed for this reader, with harp, bell and sustained tones. `assets/page-turn.wav` is an original synthesized paper rustle. Music starts only after pressing its toolbar button and does not auto-resume on reload.
