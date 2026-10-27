# Sakha integration handoff

## Files and scope
`index.html` is the LP. `whatsapp/index.html` is the supplied scripted WhatsApp assistant, initially showing only the customer conversation; the Sakhaa CIP panel is hidden. All styles, scripts and local delivery assets needed by these two pages are included. No application/solution subpages, 3D models, Python generators or main website are included. Solution cards do not navigate. Header/footer navigation stays within the LP; official product/project references remain external brand links.

## AI call and AI chat — supplied widgets connected
`samvaad-integration.js` is imported by `waterproofing-page.js` before the utility handlers. It connects the existing desktop/mobile call and chat controls to separate embedded SDK instances:

- Script: https://samvaad.sakhaa.ai/samvaad-widget.js
- API base: https://api.samvaad.sakhaa.ai
- Call public agent: `ag-mvqnlvqcrm7hqgtl`, `data-mode=call`, title `Call us`.
- Chat public agent: `ag-mvqo0ghp9ylo413d`, `data-mode=chat`, title `Chat with us`.
- The supplied widget colour is #2563eb. The surrounding LP modal retains ARDEX ENDURA branding and powered by sakha.

The SDK is loaded only when the relevant control is opened. Each instance handle is captured separately because the SDK exports a single global. Opening call shows an explicit Start Web Call action; it does not immediately request microphone access. Closing the native panel invokes endCall and close on the active SDK instance. Failed script loads offer a retry. The SDK itself handles chat sessions and provider responses. The old assistant-config.json endpoints remain unused fallbacks while these widget hooks are active. No secret API keys are included.

Before final production, verify the live deployment domain in the agent/provider configuration and run a user-approved real microphone/audio test. The integration smoke test does not certify call audio.

## Enquiry / CRM
The submit listener in `waterproofing-page.js` currently validates name, Indian mobile number and email, then stores `{name, phone, email, consent}` in sessionStorage under `ardex-waterproofing-enquiry`. It does not send a lead. Replace this local-storage branch with the approved Sakha/CRM endpoint. Add the backend's actual delivery acknowledgement, failure/retry handling and approved privacy wording. Collect project details in the later conversation as agreed, rather than adding more form fields. Consent text and preview status are in `index.html`. Privacy information uses an in-page dialog, not a third page.

## WhatsApp
The desktop `.utility-whatsapp` and mobile `.mobile-whatsapp` links in `index.html` both open `/whatsapp/`. Keep this for the demo, or replace both with the approved WhatsApp Business bot destination after connecting Sakha. The supplied bot is scripted, not a WhatsApp API integration. Do not copy provider secrets into this HTML. It maintains its own prototype browser records and has a Restart chat control.

## Running / deployment by your team
Use any static HTTP server at this folder's root, for example `python -m http.server 8000`, and open `http://localhost:8000/`. Do not open through file:// because the page uses ES modules and root-relative URLs. For static Vercel hosting choose Other, no build/install command and this folder as the output root; `vercel.json` is included. Add your actual serverless/API routes for live chat and enquiries before enabling those services. This folder is the source for the requested Vercel deployment.

## Content and external dependencies
LP fonts are self-hosted. The supplied WhatsApp file uses Google Fonts with system fallbacks; self-host those fonts too if your deployment requires no font CDN. Calculator data is a captured brand configuration, not a commercial quote. Named project photographs are published brand references. Approach/applicator/hero campaign imagery is generated; customer names, portraits and quotes are fictional prototype content. Replace fictional endorsements with approved real reviews or clearly mark them as examples before a public commercial launch.
