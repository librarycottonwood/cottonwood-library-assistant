# Library assistant: actual status and next steps

Updated October 5, 2026. This document separates the tested demonstration from proposed connections. It does not change the board's Squarespace decision.

## What works

A private website repository, published ChatGPT cloud environment, separate Cloudflare preview website, saved assistant instructions, website editing, desktop/phone checks, and hosted picture previews. A fresh cloud task successfully edited and uploaded a draft. Warm voice worked after an explicit conversation instruction; saved startup instructions alone did not reliably initialize it. The current volunteer can start a new live demo with the role below; no earlier chat is required.

## What is not built or connected

Facebook/Instagram insights, Givebutter reporting, website analytics collection or reporting, production publishing with enforced human approval, persistent monitoring, or a custom interface hiding all technical activity. Sources in an ordinary ChatGPT Project do not automatically attach to the coding environment.

## Plain-language role

You are Cottonwood Library Assistant, a warm, cheerful helper for library volunteers. Begin a greeting with "Hi! 😊 What can I help with at the library today?" Help with website changes, announcements, research, website visits, post performance, and fundraising questions. Handle the details yourself. Give short answers to simple questions and useful explanations for reports. Use real connected data or supplied reports, identify its source and dates, and never invent results or imply an account is connected. Show a checked preview before asking permission to publish. Explain missing access only when it affects the request.

## Recommended tools, in order

1. Website draft and picture preview: implemented. Approval-bound production publishing and undo still need implementation.
2. Report reader: begin with real supplied Facebook/Givebutter exports, preserving source, dates and metric definitions. Existing file-reading tools can analyze a supplied report; no account connection follows from that. Use aggregate Givebutter data, excluding donor identifiers from the demo.
3. Connected read-only website report: visits, sources, popular pages, and selected catalog/donation click events. Tracking must be installed before new data accumulates. Existing historical data requires access to the old provider.
4. Connected read-only Facebook and Givebutter reports: authenticate library-authorized access, verify returned metrics against the provider, and keep publishing/messages/refunds outside reporting authority.

## Free-service decision

Earlier research proposed Cloudflare hosting, Sanity content editing and Umami Hobby analytics. Sanity is not connected in this assistant demo; conversational file editing is the demonstrated editing route. Preserve the older plan as history.

Umami Hobby is still $0 for one website, up to 100,000 events/month and six-month retention, but its hosted API/MCP access is a Pro feature ($20/month). Do not promise automatic assistant access on Hobby. Free alternatives to investigate are standard Google Analytics with its reporting API, or self-hosted Umami with separately verified hosting/database costs. A free dashboard plus supplied exports is another option. No analytics service has been selected or installed here.

Sources checked October 5:
- https://umami.is/pricing
- https://docs.umami.is/docs/cloud/api-key
- https://marketingplatform.google.com/about/analytics/
- https://developers.google.com/analytics/devguides/reporting/data/v1
- https://help.givebutter.com/en/articles/2219206-how-to-export-download-transaction-details

## Tomorrow's demonstration

Run a new website edit live and show its actual checked preview. For Facebook or fundraising analysis, supply a real report before the meeting and ask an unrehearsed question about it. Describe it as analysis of a supplied report, not a live account connection. If real data is unavailable, any sample must say "sample data" visibly and must not be described as library results. Do not claim Facebook, Givebutter, historical analytics, production publishing or continuous monitoring works before connecting and testing it.

Earlier planning documents are research/platform-and-pricing.md and research/analytics-and-privacy.md in the original cottonwood workspace. This file is the current assistant-specific status.

## Connection requirements checked October 5

Givebutter now documents an official ready-made ChatGPT plugin. Prefer that authenticated, hosted connection for fundraising questions rather than building a custom API reader. The user connects through ChatGPT's plugin directory and signs in to their existing authorized Givebutter account; each teammate authorizes their own connection. No Givebutter password or API key should be pasted into a chat. This has not been installed or tested on the library account yet.

Official guide: https://help.givebutter.com/en/articles/16301438-how-to-connect-chatgpt-to-your-givebutter-account

For Facebook, obtain access to the actual library Page and its Insights first. Use a real supplied Insights report for tomorrow if a live reporting connection cannot be prepared and verified. Do not treat a public Page URL as private analytics access.

For zero-subscription-cost hosted website analytics with an automatic reporting route, investigate standard Google Analytics and the Data API. The user needs an authorized Google sign-in and a library-owned analytics property (or access to an existing one). The maintainer installs and checks tracking, adds the relevant click events, and connects read-only reporting. No tracking or reporting connection has been configured yet; new tracking does not produce historical data.
