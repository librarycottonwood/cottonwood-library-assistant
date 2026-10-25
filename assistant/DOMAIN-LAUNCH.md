# Domain launch plan

Prepared October 21, 2026. Planning only: no DNS, nameserver, forwarding, registrar, billing or public-domain change was made.

## Verified baseline and rollback values

Domain: `cottonwoodcommunitylibrary.com`, Squarespace registration. Signed-in domain overview, DNS and nameserver controls were accessible in Safari. Renewal displayed March 7, 2027 for $15, auto-renew on. Domain lock and private registration were on. DNSSEC is on. Existing forwarding target is `http://cottonwood-community-library.square.site`.

| Record | Host | Value | TTL |
| --- | --- | --- | --- |
| A (forwarding preset) | @ | 198.185.159.144 | 4 hours |
| CNAME (forwarding preset) | www | ext-sq.squarespace.com | 4 hours |
| CNAME (Domain Connect) | _domainconnect | _domainconnect.domains.squarespace.com | 1 hour |
| CNAME (custom Google verification) | imeg6bmxarsa | gv-hc5pjuuhjv6m7t.dv.googlehosted.com | 5 minutes |

Authoritative nameservers: `ns-cloud-e1.googledomains.com`, `ns-cloud-e2.googledomains.com`, `ns-cloud-e3.googledomains.com`, `ns-cloud-e4.googledomains.com`. Safari and public DNS agreed. Public MX and root TXT queries returned no records; existing `cottonlib@shasta.com` and library Gmail are separate services. Preserve any records added later and take a fresh baseline immediately before launch.

## Recommended launch route

Keep registration and DNS at Squarespace for this release. Use **https://www.cottonwoodcommunitylibrary.com** as the canonical website, with the bare domain forwarding to it. Cloudflare Pages supports an external-DNS subdomain through a CNAME; hosting the bare apex directly on Pages requires moving its authoritative nameservers to Cloudflare. Keeping DNS avoids coupling this launch to registrar migration or a DNSSEC transition. A future apex-hosting decision is separate.

The live website is the production deployment of the library-account Pages project `cottonwood-library` (https://cottonwood-library.pages.dev). Every checked PR/CMS save already publishes there with exact-artifact verification and verified rollback; previews are separate immutable uploads. The hosting guard allows exactly `cottonwoodcommunitylibrary.com` and `www.cottonwoodcommunitylibrary.com` as extra domains on that project; any other domain stops publishing. At launch, also update `assistant/analytics.json` so consent-gated Analytics covers the real domain.

## Exact cutover sequence after website approval

1. Finish redesign/content approval and rehearse the complete preview → live workflow. Resolve test/demo event content, stale sale dates, image rights, accessibility, downloads, catalog, privacy, donation and newsletter checks.
2. Confirm the live target: library-account Pages project `cottonwood-library`, production branch `production`, hostname `cottonwood-library.pages.dev`. Do not create a separate production project.
3. Publish the approved immutable release to that production target, verify its temporary hostname, redirects and recovery, and obtain launch approval for that exact release.
4. In the production Pages dashboard, associate `www.cottonwoodcommunitylibrary.com` as a custom domain **before** changing DNS. Wait for its domain/certificate requirements and record them.
5. At Squarespace, preserve `_domainconnect`, Google verification and every unrelated record. Remove only the conflicting **www** forwarding rule/record as required by the current forwarding editor. Set `CNAME www → cottonwood-library.pages.dev`, initially with the lowest reasonable available TTL. Do not guess a Pages IP.
6. Change the bare-domain forwarding destination from the old Square site to `https://www.cottonwoodcommunitylibrary.com`. Confirm HTTPS forwarding, path/query behavior and the chosen redirect type in the actual editor; do not assume Squarespace's grouped preset can be edited independently. Preserve its apex forwarding A record if the actual UI requires it. If removing a grouped rule also removes the apex record, recreate bare-domain forwarding before considering cutover complete.
7. Keep the present nameservers, DNSSEC, lock, renewal and registration. Check authoritative and independent resolver answers, HTTPS certificates on bare/www, redirect loop avoidance and representative deep links on phone and computer.
8. Confirm website canonical URLs, sitemap, production indexing/robots, consent-gated Analytics hostname/property settings, catalog and PDF links. Register the real checkout domain in Givebutter for Apple Pay and verify eligible devices; a working card form does not establish Apple Pay.
9. Verify general checkout, newsletter signup and inbox test; publish board-approved relaunch announcements through Buffer and newsletter separately. Keep the old Square site available while verifying the new site.
10. Observe immediately, after DNS caches expire and at 24 hours. Record the actual production release and DNS baseline. Retire/cancel an old website service only after checking its real invoice and dependencies; preserve domain registration and email. No registrar transfer is needed for this launch.

## Rollback

- For content/release failure after launch: use the production publisher's tested previous-artifact restore, then check the actual hosted site.
- For unresolved custom-domain/TLS failure: restore the saved Squarespace forwarding configuration, including `www → ext-sq.squarespace.com`, the apex forwarding A `198.185.159.144`, and forwarding destination `http://cottonwood-community-library.square.site`. Keep all unrelated/new email records. Verify DNS and the actual browser redirect; DNS caches may retain prior values for the saved TTLs.
- Do not change nameservers, DNSSEC or registrar as an improvised rollback. Keep screenshots/settings and the old public destination accessible until replacement verification is complete.

Evidence and official instructions: [Squarespace domain controls](https://account.squarespace.com/domains/managed/cottonwoodcommunitylibrary.com), [current DNS](https://account.squarespace.com/domains/managed/cottonwoodcommunitylibrary.com/dns/dns-settings), [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), `cms-publisher/README.md`, `scripts/cms-publishing.mjs`.
