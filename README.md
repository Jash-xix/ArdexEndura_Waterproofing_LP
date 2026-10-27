# Waterproofing LP — team handoff

Only two pages: `/` (waterproofing LP) and `/whatsapp/` (provided WhatsApp bot, Sakhaa CIP hidden initially). There are no internal solution pages, models, main website pages, original image files, historical variants or Python build tools in this folder. The solution tiles are visual tiles, not links to internal pages. Same-page navigation and published brand product/project links remain.

HTML, CSS and vanilla JavaScript; JSON for calculator/assistant configuration. Serve this directory over HTTP. Vercel needs no build command or framework. The form stores details only in sessionStorage; there is no backend or live CRM delivery. AI call and AI chat load the supplied Samvaad widgets. WhatsApp remains the supplied scripted prototype. No credentials or saved enquiry records are included. See SAKHA-INTEGRATION.md for connection points. The folder is the deployment source; deployment details are recorded separately after verification.

## Verified deployment

LP: https://ardex-endura-waterproofing-sigma.vercel.app

WhatsApp prototype: https://ardex-endura-waterproofing-sigma.vercel.app/whatsapp/

Deployed to thexixconstant-7771s-projects/ardex-endura-waterproofing. Public page/asset loading, live AI chat reply and the call widget start screen were checked. Real microphone/audio was not tested. The enquiry form remains a browser-only prototype; CRM delivery is not connected. Call/chat adapter source is samvaad-integration.js. Verification records and screenshots are in .qa/ and excluded from deployment.

## Developer setup

Clone this repository, open a terminal in its root and run `python -m http.server 8000`. Open `http://localhost:8000/`. There are no npm dependencies or build steps. The folder must be served at the site root because its asset/module URLs start with `/`.

## CRM and callback handoff

Start with [SAKHA-INTEGRATION.md](SAKHA-INTEGRATION.md). The enquiry submit listener is in `waterproofing-page.js`; it currently validates name, mobile number and email and saves them only in sessionStorage. No CRM request or callback booking is made. Replace that storage branch with your backend request and real success/error acknowledgements.

`samvaad-integration.js` contains the public call/chat agent IDs and SDK lifecycle hooks. The call button opens a **web call**, not a telephone callback request. To offer callbacks, your team needs a CRM/backend workflow that records and schedules them. Keep provider credentials on the backend.

The current Vercel release was uploaded from this folder. Pushing this repository does not by itself connect it to Vercel; connect the GitHub repository to the existing project if automatic deployments are wanted. Select Other, no build command, and the repository root as the output directory. Local `.vercel` account links, environment files and `.qa` records are excluded from Git.
