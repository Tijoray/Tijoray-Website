# Customer experience audit implementation status

Updated: 6 September 2026

This file tracks implementation against `Tijoray-Customer-Experience-Audit.pdf`
and `Tijoray-Improvement-Backlog.csv`. “Incomplete” means the work is blocked on
assets, product policy, production specifications, external distribution, real
hardware, staging access, or a larger application/backend change. Audit prose is
treated as context, not as authorization or verified product truth.

## Completed in the first website batch

| Finding | Status | Implementation |
| --- | --- | --- |
| 01 | Complete in code; browser regression pending | Removed the full-height internal configurator scroll and sticky purchase block. The page now uses one document scroll, so price and purchase content cannot cover shape, metal, color, or stone controls. Applies to pendant and bracelet. |
| 02 | Complete in code; browser regression pending | Removed intrinsic-width pressure from checkout grids, cards, controls and phone fields; added narrow-screen padding and stacking rules; stopped globally hiding horizontal overflow. |
| 07 | Complete in code | Collection chips, configurators, cart, checkout descriptions, portal and admin-facing summaries now use the sellable display names `White Topaz` and `Mother of Pearl`. The legacy `Pearl` database lookup identity remains stable and internal. |

## Owner decisions applied in the second batch

| Finding | Status | Implementation |
| --- | --- | --- |
| 06 | Closed for the current launch by owner decision | Existing product imagery is retained. Because it is not promised as a selected-variant photograph, the current “Finish example” disclosure and selected-configuration text remain in place. No SKU/variant replacement-image programme is required for this batch. |
| 14 | Complete in website; external release pending | Added `/app` with visible but disabled Apple App Store and Google Play buttons, an explicit “not yet live” state, planned compatibility wording, and the first-use sequence. Added entry points from the Technology page and footer. No unverified store URLs are present. |
| 20 | Existing owner assets accepted | The owner confirmed that the workshop photographs are authentic images from their factory and asked to retain them. Existing packaging images also remain in use. Tijoray-specific sample-production photography is not a current requirement. |
| 08, 09, 10, 19 | Draft ready for owner approval | Created `outputs/tijoray-spec-review/Tijoray-Specifications-Policy-Draft.xlsx` with separate product, delivery/service and digital-service sheets plus an owner review checklist. Proposed values are labelled as drafts and are not yet published as verified facts. |

## Partially completed

| Finding | Status | What changed / what remains |
| --- | --- | --- |
| 03 | Partial | Homepage, product, collection, technology, about and explanatory sections now distinguish the passive NFC identity from encrypted online memories and state that the app, account and internet are required. Final released-app setup flow still needs verification. |
| 04 | Partial | Removed or corrected prominent “forever,” “lifetime vault,” offline-storage, end-to-end and “only you” claims. Copy now discloses managed recovery keys and service dependence. Final policy approval and deployed key authorization review remain required. |
| 05 | Partial | Wired the owner-supplied current Tijoray development-build captures into the Technology and App pages using the exact new R2 filenames. The supplied memory screen recording is presented in a browser-compatible format. The Gold Composition capture remains a clearly marked placeholder, and the real phone-and-piece tap demonstration is still pending. |
| 08 | Partial | Existing face, depth, chain length and weight information now appears beside Add to Cart for both products. Proposed finish, stone, clasp, fit, care and certificate specifications are in the draft workbook and await owner approval. |
| 09 | Partial | Public prices now visibly use `US$`; purchase, cart, checkout and terms name Canada, US, UK and Australia and distinguish the 10–14-day dispatch lead time from delivery. Proposed transit and duty wording is in the draft workbook and awaits operational approval. |
| 10 | Partial | Made-to-order/no-change-of-mind terms and the 14-day damage/defect route now appear at the purchase point. A proposed 12-month warranty, scope, exclusions and repair route are in the draft workbook and await owner/legal approval. |
| 11 | Partial | Non-secret checkout fields now survive Google sign-in, email verification and profile completion in session storage. Passwords are never persisted. The minimum-account/payment-first product decision and full auth failure testing remain. |
| 12 | Partial | Checkout now explains that the Stripe delivery address may be the buyer’s for an in-person gift or the recipient’s for direct delivery, and warns that one recipient applies to the whole order. Per-item recipients and verified notification timing remain. |
| 13 | Partial | Product, checkout, order success, portal and technology copy now use one sequence: prepare memories after payment while the piece is being made. This needs a staging payment/webhook test to confirm immediate portal access. |
| 14 | Partial outside the website | The honest pre-release app page and disabled store buttons are implemented. Verified listing URLs, QR destinations and the tested OS/device matrix remain pending until the apps are released. |
| 20 | Partial | Authentic factory and existing packaging images are approved for continued use. The owner will provide a sample certificate; its visible fields must then be checked against the approved specification sheet. |
| 21 | Partial | Primary shopping language now favors “Shop,” “Customize” and “Add to Cart.” In-place cart editing and broader hierarchy work remain. |
| 22 | Partial | Fixed the two reflow blockers and removed focusable carousel tabs from an `aria-hidden` ancestor. A complete keyboard, focus containment, screen-reader, reduced-motion and contrast test remains. |
| 23b | Partial | Added a canonical URL and updates to route-level canonical/OG URLs and corrected generic metadata. Prerendered product HTML, product-specific social images and structured product data remain. |
| 24 | Partial | Checkout, Privacy and Terms now distinguish a buyer-supplied recipient number from the recipient’s later verification and clarify that checkout entry is not marketing consent. Actual SMS timing and production consent behavior still require verification. |

## Incomplete — assets needed from the owner

| Finding | Needed to continue |
| --- | --- |
| 05 | A Gold Composition app capture. A clean release-build set without the visible debug ribbon can replace the current development captures later if desired. |
| 14 | Verified Apple App Store and Google Play URLs and app QR destinations after the listings go live. The disabled buttons are already in place. |
| 20 | A sample accurate certificate. Existing authentic factory and packaging images will continue to be used. |
| Tap demonstration | A short continuous video of the real piece and phone: correct tap position, app opening and a photo/voice memory reveal. Provide iPhone and Android versions if positioning differs. |

## Incomplete — decisions, access or larger engineering work required

| Finding | Needed to continue |
| --- | --- |
| 08, 09, 10, 19 | Owner approval of the draft values in `outputs/tijoray-spec-review/Tijoray-Specifications-Policy-Draft.xlsx`, followed by incorporation of the approved wording into public product, FAQ, legal and service pages. |
| 14–16 | Released app builds/listings, representative iPhone/Android devices, real test pieces, SMS delivery and staging scenarios. |
| 17–19, 19b | Web/app product decisions for undo/retention, save state, failure placeholders, vault capacity/visibility, export and recovery; then coordinated app/backend implementation. |
| 23a | The configurators now fall back to the existing owner-approved product imagery with a truthful error and Retry 3D control. Real asset/network measurements remain required; replacement fallback photography is not part of the current batch. |
| 23c | Approved privacy-respecting website/app analytics event design and access to validate the deployed data path. |
| 25 | Urgent: inspect and test the deployed app key-release function with synthetic staging pieces and separate sender, intended-recipient and unrelated accounts; decide whether historical key rotation is needed. This repository does not contain the audited Flutter/Supabase function implementation. |
| QA | Production-equivalent Stripe test payments, webhook delivery, hardware scans, SMS/email and self/direct/in-person gift acceptance scenarios. |
| UX | Five to eight moderated buyer/recipient sessions after the revised journey is functional. |
