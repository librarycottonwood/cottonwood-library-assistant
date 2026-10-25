---
name: scheduling
description: Help set up, change or stop a recurring check, report or reminder (a Claude scheduled task, also called a routine). Use when someone asks for something to happen every week or month, or on a certain day.
---

# Scheduled tasks (routines)

Claude scheduled tasks run on their own in the cloud on a schedule. They are created at https://claude.ai/code/routines by the person whose account will run them (they can't be created from inside a cloud session). The library's tasks should belong to the library's Claude account.

## What a scheduled task may do

- **Yes:** read and report. Website health, upcoming events, fundraiser totals, reminders, draft ideas for posts, a pull request with a suggested fix.
- **Never:** merge or save website changes, publish social posts, send emails, change accounts. Those always wait for a person to say yes in a conversation.

## Before creating anything

The library already has two (see `.claude/routines/`): a **daily maintenance** check and a **weekly check-in** (posted as a GitHub issue). Check whether one of those already covers the request. Prefer changing an existing task's instruction file over creating a duplicate.

## Wizard

Ask one at a time; skip anything they already told you.

1. "What should happen?" Turn it into one clear job ("Tell me next week's events and the fundraiser total").
2. "How often, and what day and time?" Suggest one ("Mondays at 9:07 a.m.?" — a few minutes past the hour starts on time). Times are Pacific.
3. "Where should the result go?" Default: a GitHub issue that staff get emailed about, or the task's own run history.

Then:
- Write the instructions as a new file `.claude/routines/<name>.md`: the exact job, what to read, where to post, what to do if something can't be checked ("say so plainly; never report zero"), and "do not merge, publish, send or change accounts". Save that file with the `website-save` flow (it's a code change).
- Walk them through creating the task, one step at a time: open https://claude.ai/code/routines → **New task** → name it → instructions: `Follow .claude/routines/<name>.md in the repository.` → pick the repository `librarycottonwood/cottonwood-library-assistant` and the library's cloud environment → set the schedule → under connectors keep only the ones the job needs → **Create** → **Run now** once to test.

## Change or stop

Changing what a task does: edit its `.claude/routines/<name>.md` file and save it; the task reads the file fresh each run, so nothing needs re-pasting. Changing the schedule, pausing or deleting: done on the task's page at https://claude.ai/code/routines (the on/off switch pauses it).
