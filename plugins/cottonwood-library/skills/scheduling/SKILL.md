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

- Check existing tasks first. The Monday "Cottonwood Weekly Website Check" already reports the fundraiser total and website health. If that covers the request, say so and offer to show it instead of making a new task.
- Create, change or pause a task only when the volunteer has authorized that action and its details. Ask for missing details before proceeding; do not ask for the same approval again.

## Schedule wizard

Ask one at a time; skip what they already said.

1. "What should happen?" — turn it into one clear job ("Tell me last week's website visitors and the fundraiser total").
2. "How often, and what day and time?" — suggest one ("Mondays at 9 a.m.?"). All times Pacific.
3. "Where should the result go?" — default: the ChatGPT Scheduled list (and the phone app notification if they have it on).

Write the task's instructions yourself: name the skill to use, the exact job, what to do if a connection fails ("say so plainly; never report zero"), and that it must not publish anything. Summarize it in plain words. If the volunteer has not already approved those details, ask "Set it up?"

Create it with the scheduling tool if this chat has one. If not, walk them through it: open ChatGPT's profile menu → **Tasks** (or **Scheduled**) → new task, paste the instructions, pick the time. One step at a time.

## Change or stop

Find the task by name, confirm, then change or pause it the same way. Don't delete the Monday "Cottonwood Weekly Website Check" — pausing it stops the weekly fundraiser total and website health reports. Check the actual task prompt before changing it. Its maintained prompt is the pointer in `assistant/tasks/weekly-maintenance-pointer.md`, which reads current instructions on each run. Do not assume the installed task has that pointer merely because the file exists.
