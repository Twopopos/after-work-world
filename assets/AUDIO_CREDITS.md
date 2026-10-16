# Birthday instrumental recording

- Game display title: **Happy Birthday to You** (melody: *Good Morning to All*).
- Source recording: **Good Morning to All.ogg**, made in GarageBand by **Eirik1231**, 31 March 2011; current audio revision dated 5 April 2011.
- Original file page: https://commons.wikimedia.org/wiki/File:Good_Morning_to_All.ogg
- Stable source description: https://commons.wikimedia.org/w/index.php?title=File:Good_Morning_to_All.ogg&oldid=1111755337
- Original audio: https://upload.wikimedia.org/wikipedia/commons/f/f5/Good_Morning_to_All.ogg
- Original SHA-1: `0ae1936c47f7e379759a6d079beb812c73e1a1d4`.
- License declaration: **Public domain, PD-self**. The recording's rights holder releases this particular work into the public domain worldwide, with a fallback grant to use it for any purpose without conditions except where law requires conditions. See https://commons.wikimedia.org/wiki/Template:PD-self .

This permission is stated for the **recording itself**. It permits this game's local embedding, copying, modification and redistribution with the downloadable project. It is not an inference from the composition's public-domain status. The source page does not impose an attribution condition on this recording; the game nevertheless includes a voluntary credit in its settings/birthday note.

The local `happy-birthday.mp3` is a modified copy: trimmed leading silence, tempo ×0.8, gain ×0.28, short fade-in and fade-out, mono MP3 at 96 kbps / 44.1 kHz. No voices, lyrics, samples or additional music were added. Original file: 14 seconds; local version: about 16.2 seconds.

Reproduction of the conversion (FFmpeg is only an optional asset-editing tool, never a runtime requirement):

```sh
ffmpeg -i Good_Morning_to_All.ogg -af "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB,atempo=0.8,volume=0.28,afade=t=in:st=0:d=0.18,afade=t=out:st=14.5:d=1.7" -ar 44100 -ac 1 -c:a libmp3lame -b:a 96k -map_metadata -1 happy-birthday.mp3
```

Source and license checked on 2026-10-16. Runtime playback uses this bundled MP3, never a remote URL.


# Outdoor exploration recordings

Both **specific recordings**, not merely their compositions, are offered by the composer under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. The official individual track pages display this license in their attribution code. CC BY 4.0 permits copying, distribution, embedding and adaptations, including distribution alongside this game; retain artist/title, source and license links and indicate the changes. This project imposes no additional restrictions on the recordings. This is separate from the birthday recording's PD-self declaration above.

License: https://creativecommons.org/licenses/by/4.0/
Legal code: https://creativecommons.org/licenses/by/4.0/legalcode.en

| Local file | Recording and creator | Official source | ISRC |
|---|---|---|---|
| `music-for-manatees.mp3` | **Music for Manatees** — Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400009 | USUAN1400009 |
| `dream-culture.mp3` | **Dream Culture** — Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046 | USUAN1300046 |

Official downloads, obtained from the track-page download link generated using its `pieces.json` metadata:

- https://incompetech.com/music/royalty-free/mp3-royaltyfree/Music%20for%20Manatees.mp3
- https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dream%20Culture.mp3

Changes to **each recording**: excerpted the first 120 seconds; loudness adjusted for quiet playback (loudnorm target −27 LUFS / −6 dBTP); 2-second fade-in and 4-second fade-out; downmixed to mono, resampled to 44.1 kHz, encoded MP3 at 64 kbps. Playback adds a gentle gain envelope. No voices or other samples added. Excerpts play sequentially and repeat as a playlist; their edited endings are faded, not claimed to be seamless loops. Both local files are 960,514 bytes (about 0.96 MB) and decode to about 120 seconds.

Credits are visible in **Pause → Music credits** and in the birthday reading screen. Keep this notice and those credits when copying or sharing the game. Source metadata and specific-recording attribution declaration checked on **2026-10-16**.

Reproduce each excerpt with FFmpeg (replace input and output filenames):

```sh
ffmpeg -i "Music for Manatees.mp3" -t 120 -af "loudnorm=I=-27:TP=-6:LRA=11,afade=t=in:st=0:d=2,afade=t=out:st=116:d=4" -ar 44100 -ac 1 -c:a libmp3lame -b:a 64k -map_metadata -1 music-for-manatees.mp3
```

Local SHA-256:

- `music-for-manatees.mp3`: `5851b5cae400d4ea95e190d1c176730f0c5d4ade6a625b057e092a2ce3429bf0`
- `dream-culture.mp3`: `6f2061e5467f6cb7996186781d9c350df18570bdf642e3da2bbf5c26ffee47f0`

The recordings have been decoded and measured, **not auditioned on a real browser or iPhone** in this environment.
