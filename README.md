# ZEDA / Symbiotic Intelligence

A six-scene, viewport-locked interactive presentation for `zeda.dev`.

## Deploy

Put these files in the same public directory:

- `index.html` — semantic markup, Open Graph, canonical, JSON-LD organization and research citations
- `style.css` — responsive presentation, transitions and no-WebGL fallback
- `app.js` — keyboard / wheel / touch navigation, evolution particle morph, Three.js shader animation
- `zeda-entity.webp` — original locally optimized cinematic entity illustration
- `zeda-logo-white.svg` and `zeda-logo-dark.svg` — supplied Zeda identity

Test locally with `python3 -m http.server 8080` and open `http://localhost:8080`. External resources: Three.js from jsDelivr and optional Google Fonts. With neither available, navigation, research and portrait fallback remain present; the animated Three.js shader requires its module to load. There is no backend.

## Navigation

Wheel, arrow keys, Page Up/Down, Space, swipe and on-screen controls. Supports reduced-motion mode; no page scroll. Each section has its own URL fragment.

## Intellectual framing

Zeda's destination is a *consent-based, two-way cognitive coupling* between a person and an adaptive AI, not merely motor control of a robotic device. The AI may have sensory and physical-world presence, but the primary research frontier is the cognitive loop: signal interpretation, individual semantic alignment, memory assistance, co-reasoning and eventual controlled feedback to the nervous system.

Published research shows individual partial capabilities, not their integration as a general-purpose human–AI merged mind. The site intentionally represents Zeda as a vision and hypothesis, not an already validated medical device or achieved consciousness merger.

## Scientific foundations

1. Tang et al. (2023), *Semantic reconstruction of continuous language from non-invasive brain recordings*, Nature Neuroscience. DOI: `10.1038/s41593-023-01304-9`. fMRI semantic decoding; requires participant cooperation, limited setting.
2. Ezzyat et al. (2018), *Closed-loop stimulation of temporal cortex rescues functional networks and improves memory*, Nature Communications. DOI: `10.1038/s41467-017-02753-0`. Direct stimulation guided by personalized neural state in monitored clinical participants; not arbitrary memory upload.
3. Roeder et al. (2024), *Developing a hippocampal neural prosthetic to facilitate human memory encoding and recall of stimulus features and categories*, Frontiers in Computational Neuroscience. DOI: `10.3389/fncom.2024.1263311`. Memory recognition effects are mixed and person-dependent, including decreases.
4. Wairagkar et al. (2025), *An instantaneous voice-synthesis neuroprosthesis*, Nature. DOI: `10.1038/s41586-025-09127-3`. Speech-related intent decoded into voice in one clinical participant, not general mind reading.

## Brainstorming / technical trajectory

Non-neural, user-controlled cognitive memory and context layer → multimodal brain sensing and individual decoder calibration → personalized neural-to-semantic alignment → experimentally evaluated closed-loop stimulation with independent clinical and ethics oversight → human-controlled integration of cognition and optional physical embodiment.

Major unresolved barriers include neural bandwidth, longitudinal stability, invasive-risk tradeoffs, safe stimulation semantics, identity and agency, neural privacy, reversibility and scientific demonstration of measurable cognitive benefits.
