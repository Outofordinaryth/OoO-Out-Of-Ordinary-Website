# OoO — Out of Ordinary · Website

Static site (HTML / CSS / vanilla JS, no build step) built from the Figma design.

## Pages
| Page | File |
|---|---|
| Home | `index.html` |
| Services | `services.html` |
| Package: Branding / Re-Brand | `package-branding.html` |
| Package: Strategy Planner | `package-strategy.html` |
| Package: Business Development | `package-business-development.html` |
| Brand Showcase | `showcase.html` |
| Case Study: Made In Heaven | `case-made-in-heaven.html` |
| About | `about.html` |
| FAQ | `faq.html` |
| Contact | `contact.html` |

Shared styles: `assets/css/style.css` · shared behaviour: `assets/js/main.js` (scroll reveal, menu, accordion, carousel, contact toast). Each page has its own stylesheet in `assets/css/`.

## Run locally
```
python3 -m http.server 8000
```
then open http://localhost:8000

## Deploy
Any static host works (Cloudflare Pages, Netlify, GitHub Pages): connect this repo, no build command, output directory = repository root.

## Still to fill in
- Contact form endpoint: set `action="https://formspree.io/f/…"` on the form in `contact.html` (until then the form only shows the confirmation toast).
- Social links in the footer (`href="#"`), real projects for Brand 02–05, and review of drafted FAQ answers.
