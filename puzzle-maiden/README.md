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

The four finale images appear at their manuscript anchors in the order Clock, Transparent House, Moon-Bunny Piece, Open Road. Their full-size artwork was supplied by the author. The five chapter texts were revised from the author’s November 12 notes, with the original protected passages retained. Browser-based read-aloud is available from the toolbar speaker.


## Reader update

The header and book fit the viewport. Navigation and progress overlay the binding; only the text, contents, or open dialog scroll. The gear opens saved preferences for text size (16–32 px), five font families, custom ink/paper colors, six palettes, music volume, and optional page-turn sound and animation. Day/night is also available from the header. Reduced-motion preferences suppress page curls.

Illustrated leaves fill the page without duplicate captions. Select any illustration for its uncropped view, then zoom from 100% to 400% and scroll to explore.

`assets/moonlit-garden.wav` is an original 53-second looping instrumental composed for this reader, with harp, bell and sustained tones. `assets/page-turn.wav` is an original synthesized paper rustle. Music starts only after pressing its toolbar button and does not auto-resume on reload.


## Illustrated palettes and bookmarks

Each preset now selects its own illustrated page-spread image: candlelight, daylight, midnight, rose, woodland (sage), and moonflower (lavender). The writing area is transparent enough to show the page texture. Settings include a fixed live book preview and an editable sample sharing the reader's font, size, and ink color. The original book/frame dimensions remain unchanged.

The ribbon at the book's upper-right corner adds or removes a bookmark. Contents lists saved pages with individual removal controls. Bookmarks persist in browser storage on this device and restore the page plus relative text scroll position. If storage is unavailable, they remain usable for the current visit. Background stars respect reduced-motion preferences. Image-generation prompts are recorded in PAGE_ART.md.

## Manuscript revision — November 12, 2026

The opening establishes the puzzleverse, the Maiden’s love of patterns, her own work, the earlier courtship, renewed trust, and shared dream promises before the first dark shift. Later repetitions are identified as recurrences. Part IV places the altered return to warmth and confrontation before her study of wounds and boundary laws. Part V ends the courtship clearly and returns her to her existing puzzle, studies, hobbies, and dreams.

Text leaves now use chapter-based links. Legacy numeric page links, saved progress, and bookmarks migrate to retained passages or the closest position in the same chapter. Scroll offsets reset for rewritten passages. Art, layout, settings, and finale order remain unchanged.

## Page narration and clearer chapter labels

Chapter titles appear on the illustrated chapter openers. Prose leaves do not repeat the part number or title; the footer still identifies the current part. The fixed book and header geometry is preserved.

The toolbar speaker reads the open leaf, or both visible leaves from left to right on desktop. Tap it again to stop. Read-aloud settings provide the device’s available voices, speed from 0.6× to 1.4×, and Pause/Resume/Stop. Voice and speed are saved on this device. Paragraphs highlight and scroll within the page while spoken; music is lowered during narration. Manual page turns, chapter navigation, and leaving the page cancel speech. Optional continuous reading turns pages automatically after each leaf/spread and stops at the back cover. Playback never starts automatically.

Narration uses the browser’s Web Speech API, without a site-managed speech service or key. Voices and availability depend on the browser/device. Short utterances keep long leaves manageable; late-loading voices, speech errors, and unsupported browsers have fallbacks. Illustrated leaves read their title and existing finale quotation; covers and character folios read their labels. No artwork captions are duplicated visually.

## Eldermere and the chapter soundtrack

Eldermere is the enchanted country where the tale begins. The puzzleverse is the universe whose puzzle laws govern the story.

Settings now include a six-track soundtrack. “Follow the story’s mood” loops the appropriate theme for Parts I–V and uses Moonlit Garden for the covers, prologue, and folio. “Play the whole playlist” advances through all six tracks and wraps. Choosing an individual track switches to looping that track. Previous/next controls are also available. Music starts only after Play, remains paused through navigation if the reader pauses it, and never resumes automatically on reload. Narration still lowers the music volume.

Five new original instrumental compositions are served as compressed stereo MP3s, approximately 65–93 seconds each, under `assets/music/`. See MUSIC.md for the track list.

## Character entrances and continuous narration

The Maiden’s entrance now introduces her beauty, wisdom, features, love of patterns, and the origin of her name before the first concrete puzzle example. The Knight receives his proper introduction before any reference to his return. Both accounts of their earlier courtship say that she had only just stepped beyond girlhood and he had stood just before the gates of manhood.

The longer opening stays on one intentional leaf (`keepOpeningTogether`) so existing chapter text links retain their destinations. The book still has 94 leaves.

The Read aloud settings include **Keep reading and turn pages automatically**, off by default and saved on the device. Automatic turns allow the curl animation to finish before speech resumes. Pause suspends pending turns; Stop, manual navigation, a speech error, or the end of the book ends the current reading session. Turning the option off lets the current leaf finish and cancels a pending turn. Voice previews never turn pages. Playback never resumes automatically on reload.

The voice picker shows English narrators by default, hides novelty voices unless Show all device voices is selected, and prioritizes voices whose names indicate natural/neural/enhanced/premium quality. Familiar storytelling voices follow. Try this voice previews a short sample, and Refresh voices checks the browser again after system downloads. The Mac help link explains how to add system voices; the site cannot install voices or guarantee that a browser exposes all installed options.
