# Mobile responsive review

The page uses a fluid layout with CSS breakpoints for tablet and phone widths, a mobile-specific hero image, safe-area spacing, and a compact cover layout for short landscape screens. This is a source review, not a record of physical-device or automated browser testing.

## Suggested viewport checks

| Device class | CSS viewport |
|---|---:|
| Narrow phone | 320 × 640 |
| Small iPhone / Android | 375 × 667 |
| Common phone | 390 × 844 |
| Large phone | 430 × 932 |
| Small tablet | 768 × 1024 |
| Desktop | 1280 × 800 |

Also test a phone in landscape orientation and an iPhone with a home-indicator/notch safe area.

## Review checklist

- [ ] No horizontal page overflow at 320 px and at wider phone sizes.
- [ ] Navigation opens and closes on mobile; links remain reachable.
- [ ] Cover and hero content fit without clipping in portrait and short landscape viewports.
- [ ] The personalized guest name in the hero invitation stays clear of the following text at narrow widths.
- [ ] The 3D card flips to the postcard back; names, event times, venues, and full addresses remain legible without clipping.
- [ ] The envelope back and 3D card back retain the cover-floral.svg floral design.
- [ ] Countdown and calendar remain readable at narrow widths.
- [ ] Forms are usable with the on-screen keyboard; labels, validation messages, and submit status remain visible.
- [ ] Buttons and links have comfortable touch targets.
- [ ] Gallery lightbox fits within the viewport and can be closed by button, backdrop, and Escape.
- [ ] Safe-area spacing and reduced-motion behavior work in the target browsers.

## Deployment follow-up

Repeat checks on the deployed HTTPS site in iOS Safari and Android Chrome. Browser chrome, installed fonts, network conditions, and hosting configuration can change the rendered experience. No physical-device results are asserted by this source review.
