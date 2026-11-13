# Backend configuration checklist

## Before launch

- [ ] Create the Google Sheet and deploy `google-apps-script/Code.gs` as a Web App. See [GOOGLE-SHEETS-SETUP.md](./GOOGLE-SHEETS-SETUP.md).
- [ ] Set `apiUrl` in `config.js` to the active Apps Script `/exec` URL.
- [ ] Optionally replace the `siteUrl` placeholder in `config.js` with the final HTTPS website URL; the guest-link generator uses this value as its base URL.
- [ ] Deploy the complete website folder without changing its relative file structure.
- [ ] Confirm the Web App access setting permits the intended guests to submit responses.

## Acceptance test

- [ ] Open the deployed HTTPS website and confirm the RSVP section reports that Google Sheets is connected.
- [ ] Submit a test RSVP. Confirm a row appears in `RSVP` and the page displays its success confirmation.
- [ ] Submit a test wish. Confirm a row appears in `Wishes` with `Pending`.
- [ ] Change the test wish to `Approved`, reload the website and confirm it is listed.
- [ ] Change a test wish to another status, reload, and confirm it is not listed.

## Operational notes

- The browser verifies a submission by querying for its ID after sending it. A timeout or missing ID is reported as an error; it is not a confirmed save.
- New wishes are saved as `Pending` and shown only in the sender's current page. Only approved wishes are returned by the backend on page load.
- `siteUrl` is used by the guest-link generator. The configured RSVP deadline is not enforced by the current form.
- The public Apps Script endpoint uses a hidden honeypot and a lightweight per-identity limit (5 accepted submissions per 10 minutes). Apps Script does not expose the caller IP to this web app, so this is abuse friction rather than strong bot protection; use a server-verified CAPTCHA or a backend with IP controls if stronger protection is needed.
- VietQR gift details and the official YouTube embed for “Hơn Cả Yêu” are configured in the current page.
- Do not place secrets or sensitive personal data in frontend configuration or the public spreadsheet.
