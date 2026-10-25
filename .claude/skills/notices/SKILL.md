---
name: notices
description: Put up, change or take down the banner across the top of the website for a closure, holiday, weather problem or temporary hours, or change the library's regular hours. Use when someone says the library will be closed or open different hours.
---

# Notice banner and hours

Notices are Sanity `notice` records. Save every change with the `website-save` skill.

The banner shows on every page between its start and end dates, then hides by itself (the visitor's browser checks the date, so no rebuild is needed for it to disappear).

## Closure banner

Ask one at a time; skip anything they already told you.

1. "What should it say?" Tighten it to one short sentence: "Closed Thursday, Nov 26 for Thanksgiving. Happy holidays!" Always confirm the exact days, even for holidays ("Just Thursday the 26th, or Friday too?"). Never assume.
2. "When should it start showing?" Default: today.
3. "When should it come down?" Default: the last closed day. Repeat dates back with weekdays.
4. "Should it link anywhere?" Optional, for example a news post.
5. "Post it on Facebook too?" After saving, use the `social` skill.

Check for an existing banner about the same closure first; fix that one instead of adding a second. Show it, get a yes, save.

## Change or remove

Find the banner, confirm it, edit or unpublish it, save. Expired banners are already hidden; cleaning them up is optional.

## Regular hours

A permanent change to opening hours is not a banner. Edit `library-settings` → `library.hours` once (the site derives the hours summary and phone link from it). Confirm every day's new hours before saving.

## Fields (`notice`)

`slug.current`, `message`, `startsOn`, `endsOn` (YYYY-MM-DD, Pacific, both days included; end can't be before start), optional `link {label, href}`. Full contract: `studio/README.md`.
