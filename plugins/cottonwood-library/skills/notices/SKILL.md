---
name: notices
description: Cottonwood Library closure and announcement banner — library closed, holiday hours, closing early, weather, power outage, "heads up" message across the top of the website; change or remove a banner. Use with library-assistant for voice and the preview-then-save rule.
---

# Notice banner

Follow library-assistant for voice, Chat-vs-Codex and preview → "save it". Technical steps (banner fields, dates): repository `assistant/content/notices.md`. Read it before editing.

The banner shows across the top of every page between a start and end date, then disappears by itself.

## Banner wizard

Ask one at a time; skip what they already said.

1. "What should it say?" — then tighten it to one short sentence ("Closed Thursday, Nov 26 for Thanksgiving. Happy holidays!").
   Always confirm the exact days, even for a holiday ("Just Thursday the 26th, or Friday too?"). Never assume.
2. "When should it start showing?" — default: now.
3. "When should it come down?" — default: the end of the closure day. Repeat dates back with the weekday.
4. "Should it link anywhere?" — optional, e.g. a news post.
5. "Want to post it on Facebook too?" — after saving, use the social skill.

Preview and ask to save.

## Change or remove

Find the banner, confirm it, edit or take it down, preview, save. Expired banners can be cleaned up anytime; they're already hidden.

Regular hours changing for good isn't a banner — that's an hours update, handled by library-assistant.
