---
name: news
description: Write, publish, fix or take down a library news post, announcement, thank-you, or event recap with photos. Use when someone says "post this on the website", "add a news post", "share photos from the event", or wants to change or remove a post.
---

# Library news

Posts are Sanity `post` records. Save every change with the `website-save` skill.

## New post

Ask one at a time; skip anything they already told you.

1. "What's the news?" Let them tell it in their own words, even rough notes.
2. "Any photos to add?" Optional. The cover photo follows `website-save` → "Picture shape and dead zones". Ask who or what is in a photo only if you need it for the description.
3. "Should it go on Facebook too?" Note the answer; after saving, use the `social` skill.

Then write it: a clear title, a one-line summary, two or three short paragraphs. Use today's date unless they say otherwise. Don't invent quotes, names, numbers or dates. Show the draft and get a yes on the facts, then save it with `website-save`.

## Event recap with photos

Same steps, starting with "Which event was it?" Find the event in Sanity and link it in `eventRefs[]`. Lead with the photos and a thank-you to volunteers and attendees. A few good photos make a small gallery (`gallery[]`); the best one is the cover (`image`). Every photo needs alt text. Upload photos as described in `website-save` ("Photos").

## Fix a post

Find it by title or topic. If there's any doubt, confirm ("The October book sale post?"). Change only what they asked, keep its address (slug), then save.

## Take a post down

Confirm the title first. Unpublishing removes it from the news list and the homepage. Check whether other pages link to it. Keep its photos; other pages may use them. Then save.

## Fields (`post`)

`title`, `slug.current` (sets the `/librarynews/<slug>/` address; lowercase-with-hyphens; keep it when editing), `summary`, `category`, `publishedAt` (display date; a future date does not schedule anything), `body` (Portable Text blocks with stable `_key`s), `image` (cover), `gallery[]`, `eventRefs[]`. Full contract: `studio/README.md`.
