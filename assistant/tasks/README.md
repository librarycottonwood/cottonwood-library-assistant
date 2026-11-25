# Scheduled task prompts

Canonical copies of the prompts behind the ChatGPT Scheduled tasks in the
library account. ChatGPT keeps no history of task edits
and anyone signed in can change them, so this folder is the source of truth.

| ChatGPT task | Pasted prompt | Full instructions | Schedule | Executor | Notifications |
| --- | --- | --- | --- | --- | --- |
| Weekly Maintenance Check | `weekly-maintenance-pointer.md` | `weekly-maintenance.md` | Monday 14:00 America/Los_Angeles | Cloud (check its enabled/paused state in the library ChatGPT account) | Push and email (account-wide Tasks setting) |
| Monthly board report | `monthly-board-report.md` | Same file (no pointer) | 1st of each month 9:00 America/Los_Angeles, no end date | Cloud, same chat every run, default model, medium effort | Push and email (account-wide Tasks setting) |

The weekly task's maintained ChatGPT prompt is the short pointer in
`weekly-maintenance-pointer.md`: it tells the task to open
`weekly-maintenance.md` on main through connected GitHub and follow it. To
change what the weekly check does, edit `weekly-maintenance.md` and merge it;
nothing needs re-pasting. Only re-paste the pointer if the task drifts or is
deleted (recreate it with the same schedule).

The monthly board report keeps its full prompt in ChatGPT (no pointer), so a
run never depends on reading GitHub. Its results post into the pinned chat
"Monthly board report". ChatGPT has no per-task notification option: the
account-wide Settings > Notifications > Tasks setting (Push, Email) covers every
task, and the settings page does not show which address it emails.

For any other task without a pointer: edit the file here first, then paste it
into the task in ChatGPT. Pinned chats in the sidebar are not tasks and have
no prompt to keep here.
