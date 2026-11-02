# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/) and this project adheres to Semantic Versioning.

## [0.4.1] - 2026-11-02

### Fixed
- The hero button ("Explore what’s possible" / "Explore o que é possível") now scrolls to section 01, the engineering principle, instead of skipping to section 02.

## [0.4.0] - 2026-11-02

### Added
- Team section below "The approach", in English and Portuguese: founder photo, bio, and the career logos (MIT, GP Investments, BTG Pactual, Gradus) in brand colors lightened for the dark background, in a row under the bio, with the photo centered vertically and the bio in two paragraphs. The section keeps a 20% label column like "The approach" and caps its content width on large screens. Below it, "1 founder, 10 (for now) AI agents": a chief of staff plus agents across finance, growth, operations and engineering, with the robot avatars from the institutional deck. Copy adapted from the institutional deck's "Quem somos nós" slide.
- "Team" / "Time" link in the header navigation.

### Changed
- "Find your starting point" is now section 04.

## [0.3.1] - 2026-10-30

### Fixed
- The contact form honeypot field is now named `botcheck`, the name Web3Forms' own server-side filter looks for; it was `_hp`, which only the page script checked, so API-level bots passed through.
- Content-Security-Policy and a referrer policy are declared on both pages via meta tags, restricting scripts, styles and fonts to the site itself and connections to the Web3Forms endpoint.

## [0.3.0] - 2026-10-30

### Added
- Brazilian Portuguese version of the site at /pt/ (page copy, contact popup, status messages and form subject translated).
- Language detection: a browser whose first preferred language is Portuguese is sent to /pt/ on the first visit; a PT / EN switch in the header lets anyone override, and the choice is remembered on that device.
- hreflang and canonical tags on both pages, and both URLs in the sitemap, so search engines index each language separately.
- Hidden "language" field in the contact form so each message says which version it came from.

## [0.2.1] - 2026-10-30

### Changed
- Browser tab title shortened to "DeterminismLabs".

## [0.2.0] - 2026-10-30

### Added
- Contact popup ("Get in touch"): name, email, company and message fields, all required, honeypot anti-spam, thank-you state and a direct email fallback. Submissions are relayed to contact@determinismlabs.ai through Web3Forms.
- determinismlabs.com forwards permanently (301) to https://determinismlabs.ai (configured at GoDaddy).

### Changed
- The navigation button "Find your opportunity" is now "Get in touch" and opens the popup; the bottom "Get in touch" button opens the same popup instead of launching the mail app.

## [0.1.0] - 2026-10-30

### Added
- Landing page (hero, approach, opportunity sections) with the 36-second procedural motion scene, taken from the brand concept page.
- Manrope and IBM Plex Mono web fonts with their OFL licenses, wordmark and favicon.
- GitHub Pages deployment with the custom domain determinismlabs.ai (CNAME), robots.txt and sitemap.xml.

### Changed
- Logo link points to the site root instead of the internal brand guide; footer shows a copyright line instead of the brand-concept link.
- Meta description rewritten for the live site.
