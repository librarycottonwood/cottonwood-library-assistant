// Public lessons. Account names and sign-in details are in assistant/ACCOUNT-REGISTER.md.
// The website and printable handbook use this same text.
export const reviewed = 'November 5, 2026';
export const academyUrl = 'https://cottonwood-library.pages.dev/academy/';
export const practicePrefix = "This is a practice exercise. Keep it in this conversation; do not change the library’s website or accounts. ";
export interface Part {
  id?: string;
  title: string;
  text: string[];
  steps?: string[];
  prompt?: string;
  links?: { label: string; href: string }[];
}
export interface Lesson { slug: string; title: string; summary: string; parts: Part[]; }
export const services = [
  { group: 'Writing, website and communications', name: 'ChatGPT + Cottonwood Library', href: 'https://chatgpt.com/', purpose: 'Write announcements, change website content and ask questions about library reports.', access: 'Sign in to the library’s ChatGPT account. It has the Cottonwood instructions and connections to the library’s other tools.', connection: 'Start with a request such as “Add an event to the website.” ChatGPT will ask for the details.' },
  { group: 'Writing, website and communications', name: 'The library website', href: 'https://cottonwood-library.pages.dev/', purpose: 'The pages visitors read: events, hours, services, news and newsletters.', access: 'Open the website to see what visitors see. There is no sign-in for reading it.', connection: 'To change something, copy the page’s address and paste it into ChatGPT with your request.' },
  { group: 'Writing, website and communications', name: 'Givebutter', href: 'https://dashboard.givebutter.com/', purpose: 'Donation records, fundraisers and the newsletter mailing list.', access: 'Sign in to Givebutter for cash/check entries and newsletter emails. This is a separate account from ChatGPT.', connection: 'Transactions holds donations. Contacts holds the mailing list. Engage is where you write and send an email.' },
  { group: 'Writing, website and communications', name: 'Buffer', href: 'https://publish.buffer.com/', purpose: 'Review and publish the library’s social posts.', access: 'Sign in to Buffer, then open Publish. Drafts contains unfinished posts; Queue contains scheduled posts; Sent contains published posts.', connection: 'ChatGPT can prepare a Facebook draft for you to review here. Instagram setup is still awaiting confirmation.' },
  { group: 'Writing, website and communications', name: 'Facebook and Instagram', href: 'https://www.facebook.com/', purpose: 'The library’s public social pages.', access: 'Facebook Page access uses your own Facebook account after you have been added to the Page. Ask Todd if the library Page is missing from your account.', connection: 'The links below open the library’s pages. A post on Facebook is separate from an announcement on the website.' },
  { group: 'Writing, website and communications', name: 'Gmail and Google Drive', href: 'https://drive.google.com/', purpose: 'Email, shared documents, newsletter files and photos.', access: 'A shared Drive folder opens with the Google account that received its invitation. Check which account is selected if a file says you need access.', connection: 'Download the photo or PDF you want to use, then attach it to your ChatGPT message.' },
  { group: 'Writing, website and communications', name: 'Library email', href: 'https://cottonwood-library.pages.dev/visit/', purpose: 'The mailbox for library correspondence and newsletter replies.', access: 'Open the library’s existing mail app. Its contact mailbox is separate from Gmail.', connection: 'Use this mailbox to reply to an individual. Use Givebutter Engage to email the newsletter list.' },
  { group: 'Catalog, meetings and reports', name: 'Follett Destiny catalog', href: 'https://cottonlib.follettdestiny.com/', purpose: 'Search the library’s books.', access: 'The link opens the catalog. Ask a circulation volunteer to show you the staff sign-in and book checkout screens.', connection: 'Book checkouts and patron records are handled in the catalog system, not in ChatGPT.' },
  { group: 'Catalog, meetings and reports', name: 'Zoom', href: 'https://zoom.us/join', purpose: 'Online library meetings.', access: 'Open the Zoom link in the meeting invitation. If prompted, enter the passcode from that invitation.', connection: 'You can also choose Join in Zoom and enter the meeting ID.' },
  { group: 'Catalog, meetings and reports', name: 'Google Analytics / Library Analytics', href: 'https://analytics.google.com/', purpose: 'See how many people visit the website and which pages they read.', access: 'Ask ChatGPT for the report. Library Analytics is the connection it uses to read Google Analytics.', connection: 'For example: “Which website pages were most popular last month?” Donation amounts come from Givebutter instead.' },
  { group: 'Website administration', name: 'Sanity', href: 'https://cottonwood-community-library.sanity.studio/', purpose: 'Stores website text, event dates, photos and newsletter PDFs.', access: 'ChatGPT edits this content when you ask for a website update. You do not need to open Sanity for that.', connection: 'You may see its name while ChatGPT is working on an event or newsletter.' },
  { group: 'Website administration', name: 'GitHub', href: 'https://github.com/', purpose: 'Keeps the website files and a history of changes.', access: 'ChatGPT uses GitHub to prepare and save website updates.', connection: 'A “pull request” is the proposed change being reviewed. Your part is to look at the website preview and decide whether it is ready.' },
  { group: 'Website administration', name: 'Codex', href: 'https://chatgpt.com/', purpose: 'Makes changes to the website’s design and code.', access: 'Ask for the change in ChatGPT, such as “Make the text on this page larger.” The website maintainer uses Codex for the technical work.', connection: 'Routine events and news updates can be handled in the library conversation.' },
  { group: 'Website administration', name: 'Cloudflare', href: 'https://dash.cloudflare.com/', purpose: 'Hosts the website so people can open it online.', access: 'Todd manages the library’s hosting account.', connection: 'You do not need this dashboard to update a page.' },
  { group: 'Website administration', name: 'Squarespace', href: 'https://account.squarespace.com/', purpose: 'Manages the library’s registered web address.', access: 'Todd handles this account and the address renewal.', connection: 'The web address and the website itself are managed in different places: Squarespace and Cloudflare.' },
  { group: 'Website administration', name: 'Square / the earlier website', href: 'https://cottonwood-community-library.square.site/', purpose: 'An earlier version of the library website.', access: 'This link is included so you can recognize an old bookmark.', connection: 'Square and Squarespace are different services. Changes made to the new website do not appear on this older one.' },
];
export const lessons: Lesson[] = [
  {
    slug: 'start-here', title: 'Using ChatGPT',
    summary: 'Start a conversation, attach a file and ask for changes.',
    parts: [
      {
        title: 'Open a conversation',
        text: ['ChatGPT is a program you can talk to by typing. It can write a first draft, explain something or carry out a task using the library’s connected tools.'],
        steps: [
          'Open chatgpt.com and sign in to the library’s account.',
          'Choose New chat. For website updates, choose Work at the top of the new conversation. Chat is enough for questions or rewriting text.',
          'Type your request in the message box and send it. When ChatGPT asks a question, answer in the same box.',
        ],
        prompt: 'Help me write an announcement for the library. Ask me what it is about.',
        links: [{ label: 'Open ChatGPT', href: 'https://chatgpt.com/' }],
      },
      {
        title: 'You can change the answer',
        text: ['The first answer is a starting point. You can reply with “Make it two sentences,” “Use simpler words,” or “Add that admission is free.” You do not have to write the whole request again.', 'If ChatGPT gets a name, date or other detail wrong, tell it the correct information. Read the final wording before using it.'],
      },
      {
        title: 'Add a photo, flyer or newsletter',
        text: ['Click the attachment button beside the message box and choose the file from your computer. Once it appears in the message, tell ChatGPT what to do with it.'],
        prompt: 'Read this flyer and pull out the event name, date, time and location. Show me what you found.',
      },
      {
        title: 'Find an earlier conversation',
        text: ['Open the sidebar to see your conversations. Select the one you want to continue; its earlier messages and attachments are still there.', 'Use the same conversation while revising one announcement. Start a new one when you move to a different task.'],
        links: [{ label: 'More about using ChatGPT', href: 'https://learn.chatgpt.com/docs/use-chatgpt' }],
      },
    ],
  },
  {
    slug: 'accounts-and-tools', title: 'Accounts and websites',
    summary: 'What each service is for and where to open it.',
    parts: [
      {
        title: 'The tools you will use most',
        text: ['Use ChatGPT to write announcements and request website changes. Use Givebutter to record donations and send newsletter emails. Use Buffer to review Facebook posts. Google Drive holds shared files such as photos and newsletter PDFs.'],
      },
      {
        title: 'Which account do I use?',
        text: ['These services have separate sign-ins. The library’s account sheet lists the email address and sign-in method for each one. Todd has that sheet and can help you get access.', 'For Google Drive, use the Google account that received the folder invitation. For the library’s Facebook Page, use the Facebook account that was added to the Page.'],
      },
      {
        title: 'What are agents, skills and connections?',
        text: ['The agent is the assistant doing the work in ChatGPT. A skill is a set of instructions: the newsletter skill, for example, tells it how the library handles a new issue. A connection lets it use another service, such as Givebutter or the website editor.', 'You can ask “Add an event” or “Help with the newsletter.” You do not need to choose a skill yourself.'],
      },
    ],
  },
  {
    slug: 'preview-and-save', title: 'Changing the website',
    summary: 'Add an event, correct a page or upload the newsletter.',
    parts: [
      {
        id: 'add-event', title: 'Add an event',
        text: ['Open a new Work conversation in the library’s ChatGPT account. You can type the details or attach a flyer.'],
        prompt: 'Add an event to the library website. Ask me for the details you need.',
        steps: [
          'Give the event’s name, date, start and end times, location and any cost. Attach a photo if you want one on the page.',
          'Read the wording ChatGPT writes. Reply with any corrections.',
          'Open the preview link. It shows how the page will look on the website.',
          'When it looks right and ChatGPT asks “Ready to save?”, reply “Yes, save it.” Then open the website link it gives you.',
        ],
      },
      {
        id: 'correct-page', title: 'Change something already on a page',
        text: ['Open the page you want to change and copy its address from the browser. Paste it into ChatGPT, then say which words, dates or pictures need changing.', 'For regular opening hours, give the days and new times. For a one-day closure, use the closure instructions in the next lesson about problems.'],
        prompt: 'On this page, change [old wording] to [new wording]: [page link].',
      },
      {
        id: 'newsletter-pdf', title: 'Put the new newsletter on the website',
        text: ['Attach the newsletter PDF to a Work conversation. ChatGPT can read it and suggest a title and description.'],
        prompt: 'Put this newsletter on the website as the latest issue. Keep the older issues in the archive.',
        steps: ['Review the title and description.', 'Open the preview and click the newsletter to check that the right PDF opens.', 'Tell ChatGPT to save it. Keep the finished page’s link if you will also email the newsletter.'],
      },
      {
        title: 'What does “preview” mean?',
        text: ['A preview is a separate copy of the website showing your proposed change. You can look at it before it replaces the current page.', 'If ChatGPT says the save includes another person’s changes too, read that list before saying yes. If you want something changed, reply in the conversation and ask for another preview.'],
      },
    ],
  },
  {
    slug: 'everyday-jobs', title: 'Newsletters, Facebook and donations',
    summary: 'Send an email, find subscribers, record a gift and read reports.',
    parts: [
      {
        id: 'send-newsletter', title: 'Email the newsletter',
        text: ['ChatGPT writes the email; you send it from Givebutter. First put the PDF on the website using the previous lesson, so the email can link to it.'],
        prompt: 'Write a short email introducing this newsletter: [newsletter link]. Include a subject line and a link to read the issue.',
        steps: [
          'Open Givebutter on a computer. Choose Engage, then Emails, then New Email.',
          'Choose a template. Copy the subject and message from ChatGPT into the email, including the newsletter link.',
          'Click Next to choose recipients. Filter by the Library Newsletter tag. This is the library’s subscriber list; Givebutter excludes unsubscribed or blocked addresses.',
          'Review the email and recipient list. Choose Send now and Send, or Schedule for later if you want it to go out at another time.',
        ],
        links: [{ label: 'Open Givebutter', href: 'https://dashboard.givebutter.com/' }, { label: 'Givebutter’s email instructions', href: 'https://help.givebutter.com/en/articles/6523588-how-to-create-an-outbound-email' }],
      },
      {
        id: 'subscribers', title: 'See who has signed up for the newsletter',
        text: ['In Givebutter, open Contacts. Choose Filter, then Tags, and select Library Newsletter. People who sign up through the website are added to this group.', 'To check one person, search for their email address and open their contact record. A list of donors or library patrons is a different list from newsletter subscribers.'],
      },
      {
        id: 'facebook', title: 'Make a Facebook post',
        text: ['Give ChatGPT the event or news page you want to share. It can use the page’s details and photo.'],
        prompt: 'Write a Facebook post about this: [page link].',
        steps: [
          'Read the post in ChatGPT and ask for any changes.',
          'When you like it, ask ChatGPT to put the draft in Buffer.',
          'Open Buffer → Publish → Drafts. Find the post and check that it is for the library’s Facebook Page.',
          'Open the draft to publish it or choose when it should go out. Published posts appear under Sent; scheduled posts appear in Queue.',
        ],
        links: [{ label: 'Open Buffer', href: 'https://publish.buffer.com/' }, { label: 'Finding drafts and sent posts in Buffer', href: 'https://support.buffer.com/articles/how-to-use-the-all-channels-view-in-buffer-oqqE4Sdf3T' }],
      },
      {
        id: 'cash-check', title: 'Record a cash or check donation',
        text: ['Use Givebutter to record money the library has already received. You will need a Givebutter admin or editor account to add a transaction.'],
        steps: [
          'Open Transactions and click New Transaction.',
          'Choose the campaign the donation belongs to, then select the donor or add a new contact.',
          'Enter the amount and the date the donation was received. For Payment method, choose Cash or Check. A check entry also has fields for its number and deposit date.',
          'Choose whether to email a receipt and whether the donor’s name and amount should appear publicly. Click Save.',
        ],
        links: [{ label: 'Open Givebutter', href: 'https://dashboard.givebutter.com/' }, { label: 'Givebutter’s cash and check instructions', href: 'https://help.givebutter.com/en/articles/2705864-how-to-add-and-manage-offline-transactions' }],
      },
      {
        id: 'reports', title: 'Get figures for a meeting',
        text: ['Ask ChatGPT for the dates and figures you need. It uses Givebutter for donation totals and Library Analytics for website visits.', 'A click on the Donate button means someone opened it. Givebutter tells you whether a donation was completed.'],
        prompt: 'For last month, how much did the library receive in donations, how many people visited the website, and which pages were most popular?',
      },
    ],
  },
  {
    slug: 'when-something-goes-wrong', title: 'Closures and website problems',
    summary: 'Announce a closure, cancel an event or get a broken page fixed.',
    parts: [
      {
        id: 'closure', title: 'The library needs to close for a day',
        text: ['Tell ChatGPT the closure date and the reason you want displayed. It can put a notice across the website without changing the normal weekly hours.'],
        prompt: 'The library will be closed on [date] because [reason]. Add a notice to the website for that day.',
        steps: ['Review the notice and website preview, then tell ChatGPT to save it.', 'If you also want a Facebook announcement, say “Write a Facebook post about this closure too.” Review that draft in Buffer.'],
      },
      {
        id: 'cancel-event', title: 'An event is canceled or rescheduled',
        text: ['Send ChatGPT the event’s page link and identify the date being changed. For a repeating event, say whether this affects just one session or the whole series.'],
        prompt: 'Cancel the [event name] session on [date]. Leave the other dates as they are.',
      },
      {
        id: 'wrong-page', title: 'The website still shows the old information',
        text: ['Refresh the page once. If it still shows the old text, open the ChatGPT conversation where you requested the change and paste the page link. Tell it the specific difference.'],
        prompt: 'This page still has the old hours: [page link]. I asked you to change them earlier in this conversation. Can you finish the update?',
      },
      {
        id: 'broken-link', title: 'A page or button does not work',
        text: ['Copy the page’s address into ChatGPT and describe what you clicked and what happened. For example, “I clicked Donate, but nothing opened.” A screenshot is useful if there is an error message.'],
        prompt: 'The Donate button on this page does not open when I click it: [page link]. Can you find out why?',
      },
      {
        id: 'access', title: 'You cannot get into an account',
        text: ['Check that you are opening the right service with the sign-in method on the library’s account sheet. If it still fails, contact Todd and tell him which account you cannot open.', 'If Givebutter says a donation failed but the donor thinks they were charged, ask the person handling donations to look up that transaction before attempting another payment.'],
      },
    ],
  },
  {
    slug: 'practice-with-a-buddy', title: 'Try it in ChatGPT',
    summary: 'Three exercises: rewrite an announcement, read a flyer and plan an event page.',
    parts: [
      {
        title: 'Rewrite a short announcement',
        text: ['Copy this message into ChatGPT. After it replies, ask “Make it one sentence.” Notice that you can keep revising the same answer.'],
        prompt: practicePrefix + 'Write a short announcement saying our library is holding a book sale. Use no date or time yet.',
      },
      {
        title: 'Read a flyer',
        text: ['Attach a library flyer. Ask ChatGPT to find its details, then compare the answer with the flyer. If it misses something, point it out.'],
        prompt: practicePrefix + 'Read this flyer and list the event name, date, start and end times, location and cost. If a detail is missing, tell me.',
      },
      {
        title: 'Walk through adding an event',
        text: ['This exercise lets you see the questions ChatGPT asks before making an event page. Answer with made-up details. At the end, ask to see the finished wording.'],
        prompt: practicePrefix + 'Walk me through adding a book sale to the website. Ask me one question at a time, then show me the event description.',
      },
    ],
  },
];
export const quickReference = [
  ['Add an event', 'In ChatGPT: “Add an event to the website.” Give it the name, date, start and end times, location and cost.'],
  ['Correct a page', 'Paste the page link into ChatGPT and say what to change. Open the preview, then reply “Yes, save it” when it is right.'],
  ['Upload the newsletter', 'Attach the PDF in ChatGPT and say “Put this on the website as the latest newsletter.”'],
  ['Email the newsletter', 'Ask ChatGPT to write the email. In Givebutter, open Engage → Emails → New Email. Paste the draft and choose recipients tagged Library Newsletter.'],
  ['Find newsletter subscribers', 'In Givebutter, open Contacts → Filter → Tags → Library Newsletter.'],
  ['Record cash or a check', 'In Givebutter, open Transactions → New Transaction. Choose the campaign and donor, enter the amount and date, select Cash or Check, then save.'],
  ['Post on Facebook', 'Ask ChatGPT to write the post and put the draft in Buffer. Open Buffer → Publish → Drafts to review and publish it.'],
  ['Announce a closure', 'In ChatGPT: “The library is closed on [date] because [reason]. Add a website notice for that day.”'],
];
