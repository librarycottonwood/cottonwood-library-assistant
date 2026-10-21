# Scheduled task prompts

Canonical copies of the prompts behind the ChatGPT Scheduled tasks in the
library account (@cottonwoodlibrary). ChatGPT keeps no history of task edits
and anyone signed in can change them, so this folder is the source of truth.

| ChatGPT task | Pasted prompt | Full instructions | Schedule | Executor |
| --- | --- | --- | --- | --- |
| Weekly Maintenance Check | `weekly-maintenance-pointer.md` | `weekly-maintenance.md` | Monday 14:00 America/Los_Angeles | Cloud (current binding and enabled/paused status in setup-status.json) |

The task was observed paused in the library account on October 20. Confirm its actual enabled/paused status before promising a future run; editing its prompt does not resume it.

The weekly task's maintained ChatGPT prompt is the short pointer in
`weekly-maintenance-pointer.md`: it tells the task to open
`weekly-maintenance.md` on main through connected GitHub and follow it. To
change what the weekly check does, edit `weekly-maintenance.md` and merge it;
nothing needs re-pasting. Only re-paste the pointer if the task drifts or is
deleted (recreate it with the same schedule).

For any other task without a pointer: edit the file here first, then paste it
into the task in ChatGPT. Pinned chats in the sidebar are not tasks and have
no prompt to keep here.
