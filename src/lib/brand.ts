/**
 * The company behind the brand, in one place.
 *
 * Carrier vetting for 10DLC checks that the sending brand can be tied back to
 * a real registered company: the legal name, the DBA, and a contact number all
 * have to agree between the campaign registration and this website. Keeping
 * them here means the footer, the contact page, the legal pages and the SMS
 * terms cannot drift apart and cost another round of review.
 */

/** Registered company name, exactly as filed. */
export const LEGAL_NAME = 'GEN Z DIAMONDS COMPANY LIMITED'

/** Operating name customers actually see. */
export const BRAND_NAME = 'Tijoray'

/** One sentence tying the two together. Reviewers look for this verbatim. */
export const LEGAL_ENTITY_LINE = `${BRAND_NAME} is an operating name of ${LEGAL_NAME}.`

/**
 * Publicly listed business number, in E.164 for `tel:` and pretty for display.
 *
 * MUST match the contact number on the 10DLC brand registration, digit for
 * digit — the vetter's test is whether the number they were given can be found
 * on the brand's own website. Left empty deliberately: every consumer below
 * omits the number rather than render a placeholder, so an unset number is a
 * missing row, never a fake one.
 */
export const BRAND_PHONE_E164 = ''       // e.g. '+16475550137'
export const BRAND_PHONE_DISPLAY = ''    // e.g. '+1 (647) 555-0137'

export const SUPPORT_EMAIL = 'support@tijoray.com'
