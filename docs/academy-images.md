# Academy service icons

Small product logos identify the websites in the volunteer directory. Downloaded from the official sites on November 5, 2026; converted from ICO where needed and prepared through `pnpm image:prepare`. Displayed beside the product name, with a link to that service. No remote image requests are needed to read the academy.

| Asset | Source |
| --- | --- |
| academy-chatgpt.png | https://chatgpt.com/cdn/assets/favicon-48x48.7d42b2e65f.png |
| academy-givebutter.png | https://givebutter.com/favicon.ico |
| academy-buffer.png | https://buffer.com/favicon.ico |
| academy-drive.png | https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png |
| academy-github.png | https://github.com/favicon.ico |
| academy-cloudflare.png | https://www.cloudflare.com/favicon.ico |
| academy-sanity.png | https://www.sanity.io/favicon.ico |
| academy-squarespace.png | https://www.squarespace.com/favicon.ico |
| academy-gmail.png | https://mail.google.com/favicon.ico |
| academy-square.png | https://squareup.com/favicon.ico |

Codex, Google Analytics and Google Cloud use installed Lucide icons to illustrate their purpose. They are not product logos. The Drive, Gmail and Square assets are retained from the earlier directory but are no longer shown in the academy.

## ChatGPT lesson screenshots

Captured November 11, 2026 from the library’s signed-in ChatGPT website in Safari. The two source images preserve the entire browser window. Project and recent-conversation lists were collapsed before capture to keep private titles out of the images, then restored. No messages were sent or files uploaded. The example text was an existing unsent library-activity draft.

| Asset | What it shows |
| --- | --- |
| academy-chatgpt-full-window.png | New conversation, sidebar, Chat / Work choices and message box |
| academy-chatgpt-full-menu.png | The same window with the + menu open, including Add photos & files and Cottonwood Library |

The lesson component positions and zooms the full image inside a pastel canvas, using a named view for each control. Every canvas is at least 360px tall on desktop and 320px on phones. Only the outer canvas clips the intact image. Each view scales and translates the full screenshot to the actual control location, with no inner crop or inset frame. Screenshot edges have a 12px radius and a soft shadow. Canvas gradients vary between lavender, mint and peach. The navigation view anchors its native top-left corner with equal insets. The library-helper view leaves just 24px below the screenshot on desktop and 16px on phones. There is no fullscreen link. Six placements teach starting a chat, sending, mode selection, attachments, finding chats and recognizing the library helper.

Both screenshots were prepared through `pnpm image:prepare -- <file> --lossless`, registered in `src/content/images.ts` and rendered as PNG through Astro Image. Palette compression introduced gray blocks in these captures; lossless preparation preserves their pixels while removing metadata. Captions and image descriptions also enter the assistant’s generated academy wiki. Recheck the controls against ChatGPT before replacing these images; the screenshot date does not establish current tool access.

## Website and Buffer lessons

Captured November 11, 2026. The Safari captures use the library account; the newsletter capture uses the public website. Original windows and viewports are kept intact. The newsletter source is resized proportionally to 1402px and served as high-quality WebP because it contains large newsletter-cover photos. Other captures use lossless PNG. No picture is cropped into a new file.

| Asset | Source and placement |
| --- | --- |
| academy-chatgpt-website-request.png | Library ChatGPT, Work, with an unsent example request to add an event. Update the website → Add an event. |
| academy-website-newsletter.png | https://www.cottonwoodcommunitylibrary.com/newsletter/ showing the existing issues and Download PDF links. Update the website → Add the newsletter. This is the public page, not an unsaved preview. |
| academy-buffer-queue.png | Library Facebook channel in Buffer, Publish → Queue. Facebook posts → Make a Facebook post. |
| academy-buffer-editor.png | Buffer’s empty Create Post editor. Facebook posts → Check the post in Buffer. |
| academy-buffer-timing.png | The same empty editor with the posting-time menu open. Facebook posts → Choose when the post appears. |

The ChatGPT example was not sent; the original unsent draft, Chat mode and sidebar state were restored. Buffer’s editor was closed without saving or publishing, and the existing draft was left untouched. Task-owned browser windows were closed.

Coverage review: Using ChatGPT and Meet the library assistant already show the relevant ChatGPT controls. Website updates now show the request and newsletter download; Facebook instructions show the draft navigation, editor and timing menu. Closures use the same Work message box and existing attachment instructions, so another near-identical screenshot is unnecessary. Examples and Accounts retain their cards and service icons. Behind the scenes retains service icons and explanations rather than introducing administrative dashboard steps. Givebutter captures were added after the user signed in on November 11, 2026; see below for the exact coverage.

## ChatGPT navigation tour

Captured November 11, 2026 in the library’s signed-in Safari session. Full-window originals are retained under `output/academy/chatgpt-tour/`, prepared losslessly, and registered locally. The Plugins image is served as high-quality WebP to keep the page weight down.

| Asset | What it shows |
| --- | --- |
| academy-chatgpt-explore.png | Explore menu: Health, Finances, Maps, Images, GPTs and Sites |
| academy-chatgpt-library.png | Library with Images selected, showing no images yet; private file titles are not exposed |
| academy-chatgpt-scheduled.png | Scheduled task list and next-run information, without opening a task |
| academy-chatgpt-plugins.png | Plugins and Skills tabs, Installed row, Public and Personal directory tabs |
| academy-chatgpt-account-menu.png | Account menu with Personalization, Profile, Settings, Help and Log out; also supplies the sidebar overview |

No messages were sent, tasks changed, plugins installed or files created in ChatGPT. The original draft and sidebar state were restored; task-owned Safari windows were closed. The Library screenshot deliberately uses the empty Images tab instead of All, which contains private file titles.

The tour describes labels observed in this account, including Public and Personal. Background behavior was checked against OpenAI’s [ChatGPT guide](https://learn.chatgpt.com/docs/use-chatgpt), [Projects](https://learn.chatgpt.com/docs/projects), [scheduled tasks](https://learn.chatgpt.com/docs/automations), and [Plugins](https://learn.chatgpt.com/docs/plugins). These captures establish visible controls, not the health of connected services.

The beginner sequence is Your first chat, Find your way around, Photos, files and links, and Meet the library assistant. Facebook steps now have their own lesson; newsletters and donations remain together. Screenshots precede the controls or steps they explain. The same descriptions, definitions and lesson order enter the printable handbook and generated wiki.

Overview captures (Library, Plugins and Scheduled) use full framing: the complete original screenshot is centered with padding on all sides. Focused controls retain their existing zoomed views. GPTs wording follows [OpenAI’s transition guide](https://learn.chatgpt.com/docs/migrate-custom-gpts); no universal retirement date is claimed because the guide notes plan-specific timelines.

## Givebutter lessons

Captured November 11, 2026 in a separate Safari window after the user signed in. Full source images were prepared losslessly.

| Asset | Placement |
| --- | --- |
| academy-givebutter-email.png | Engage → Emails overview, before opening an email |
| academy-givebutter-templates.png | Template picker, before choosing a layout |
| academy-givebutter-subscribers.png | Contacts → Tag → Library Newsletter, before filtering subscribers |
| academy-givebutter-donation.png | Blank offline-transaction form with Check selected, before entering donation details |

Sent was selected for the email overview so the existing draft and its recipient stayed out of the image. Contacts used the fictional search academy-example@example.invalid to show the filter without exposing private contacts. The caption explains the empty result. No donor, amount or campaign was entered; no transaction was recorded. The template picker was closed without selecting or creating an email. Temporary searches and filters were cleared, and the capture window was closed.

The current Contacts interface uses Tag directly above the list, and the offline form ends with Record transaction rather than Save. The instructions now match these observed labels. Email composition, recipient selection and sending were not exercised; those instructions retain their linked Givebutter reference. No email was sent and no settings, financial accounts or existing drafts were changed.
