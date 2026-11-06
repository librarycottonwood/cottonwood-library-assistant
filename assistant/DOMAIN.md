# Domain

The website has been live on **https://www.cottonwoodcommunitylibrary.com** since Thursday, November 5, 2026 (about 8:30 p.m. Pacific).

## How it is set up

- Registration and DNS stay at Squarespace (registrant on file: Mary Ann Hasbrook, cottonlib@shasta.com; renews March 7, 2027, auto-renew on). Nameservers, DNSSEC, domain lock and registration were not changed.
- `www` is a CNAME to `cottonwood-library.pages.dev`, the library-account Cloudflare Pages project. Cloudflare issues its HTTPS certificate.
- The bare domain `cottonwoodcommunitylibrary.com` forwards (Squarespace forwarding, path kept) to `https://www.cottonwoodcommunitylibrary.com`.
- `https://cottonwood-library.pages.dev` is the same deployment and keeps working. Workflows and the CMS publisher check it; people should be sent to the www address.
- The publishing guard (`scripts/cms-publishing.mjs`) allows exactly `cottonwoodcommunitylibrary.com` and `www.cottonwoodcommunitylibrary.com` as extra domains on the project; any other domain stops publishing.
- Old Square website addresses redirect to the matching new pages (the list is in `astro.config.mjs`).
- Also set at launch: Givebutter Apple Pay domain `www.cottonwoodcommunitylibrary.com`; Turnstile allows both hostnames; Google Analytics has a "New website launched" note on November 5.

## Other DNS records to keep

| Record | Host | Value |
| --- | --- | --- |
| CNAME (Domain Connect) | _domainconnect | _domainconnect.domains.squarespace.com |
| CNAME (Google verification) | imeg6bmxarsa | gv-hc5pjuuhjv6m7t.dv.googlehosted.com |

There are no MX records; `cottonlib@shasta.com` and the library Gmail are separate services.

## Rollback

- **A bad save or release:** use the publisher's previous-artifact restore, then check the live site. The domain stays as it is.
- **The domain itself breaks (certificate or Cloudflare problem):** in Squarespace DNS, remove the `www` CNAME, set bare-domain forwarding back to `http://cottonwood-community-library.square.site` and add `www` forwarding to the same address. This puts the old Square site back while it still has a subscription. DNS caches can keep the new values for a while.
- Never change nameservers, DNSSEC or the registrar as a rollback.

Links: [Squarespace DNS](https://account.squarespace.com/domains/managed/cottonwoodcommunitylibrary.com/dns/dns-settings), [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
