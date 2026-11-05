---
name: scheduling
description: Use when a volunteer asks for a recurring check, report, reminder, or follow-up, or wants to change or stop an existing scheduled task.
---

# Scheduled tasks

Follow library-assistant for voice. These are ChatGPT scheduled tasks in this library account; results show up under Scheduled in ChatGPT.

## What a scheduled task may do

- **Read and report:** visitor numbers, Givebutter totals, upcoming events, reminders, draft ideas for posts.
- **Never on a schedule:** saving website changes (the fundraiser bar on the site is live from Givebutter, so nothing needs updating), publishing social posts, sending emails, changing accounts. Those always wait for a person to say yes. A schedule can prepare a draft and ask.

## Before creating anything

- Check existing tasks and their actual prompts first. The library's weekly maintenance review may already cover website health and fundraising. Read its maintained pointer in `assistant/tasks/weekly-maintenance-pointer.md` and verify the installed task before making a duplicate. Do not rely on a remembered task name or schedule.
- Create, change, pause or delete a task only when the volunteer has authorized that action and its details. Ask for missing details before proceeding; do not ask for the same approval again.

## Schedule wizard

Ask one at a time; skip what they already said.

1. "What should happen?" — turn it into one clear job ("Tell me last week's website visitors and the fundraiser total").
2. "How often, and what day and time?" — suggest one ("Mondays at 9 a.m.?"). All times Pacific.
3. "Where should the result go?" — default: the ChatGPT Scheduled list (and the phone app notification if they have it on).

Write the task's instructions yourself: name the skill to use, the exact job, what to do if a connection fails ("say so plainly; never report zero"), and that it must not publish anything. Summarize it in plain words and always ask "Set it up?" before creating it, even when they gave every detail up front. Giving the details is not a yes.

Create it with the scheduling tool if this chat has one. If not, walk them through it: open ChatGPT's profile menu → **Tasks** (or **Scheduled**) → new task, paste the instructions, pick the time. One step at a time.

## Change or stop

Find the actual task and confirm which one if ambiguous.

- **"Stop", "cancel", "delete", "get rid of it"** → delete the task. Ask once: "Delete the <name> task? It won't run again." After a yes, delete it and check it's gone from the list.
- **"Pause", "hold off", "skip for now"** → pause it, and tell them how to turn it back on.
- If you can't tell which they mean, ask: "Pause it for now, or delete it for good?"

If this chat's tools can't delete a task, say so and walk them through it: ChatGPT profile menu → **Tasks** (or **Scheduled**) → the task → **Delete**. Never stop at pausing when they asked to stop.

For other changes, prefer updating the existing task to replacing it. Explain when pausing it also stops its other reports. Use the maintained pointer so future runs read current instructions. Do not assume the installed task has that pointer merely because the file exists.
