// Public lessons. Account names and sign-in details are in assistant/ACCOUNT-REGISTER.md.
// The website and printable handbook use this same text.
export const reviewed = 'November 5, 2026';
export const academyUrl = 'https://cottonwood-library.pages.dev/academy/';
export interface Part {
  id?: string;
  icon?: string;
  title: string;
  text: string[];
  steps?: string[];
  prompt?: string;
  links?: { label: string; href: string }[];
}
export interface Lesson { slug: string; title: string; summary: string; parts: Part[]; }
export const serviceGroups = [
  { id: 'website', title: 'Website and assistant' },
  { id: 'communications', title: 'Donations, social posts and files' },
  { id: 'other', title: 'Other library accounts' },
];
export const services = [
  {
    "id": "chatgpt",
    "group": "website",
    "name": "ChatGPT",
    "purpose": "The place to ask for a website change, write an announcement or get a report. The Cottonwood Library instructions tell it how the library handles these jobs.",
    "signin": "Use the library’s ChatGPT account. Its library instructions and connected accounts are not in your personal ChatGPT account.",
    "href": "https://chatgpt.com/",
    "label": "Open ChatGPT"
  },
  {
    "id": "codex",
    "group": "website",
    "name": "Codex",
    "purpose": "The part of ChatGPT used to change the website’s layout, features and page files. For example, this academy’s design is changed with Codex.",
    "signin": "Uses the same account as ChatGPT. The library has a prepared workspace called cottonwood-library-editor.",
    "href": "https://chatgpt.com/codex/cloud",
    "label": "Open Codex"
  },
  {
    "id": "sanity",
    "group": "website",
    "name": "Sanity",
    "purpose": "Stores the website’s events, news, hours, notices, photos and newsletter PDFs. When you ask ChatGPT to add an event, this is where the event details go.",
    "signin": "The library signs in to Sanity through GitHub. Publishing content here prepares it for the next website save.",
    "href": "https://cottonwood-community-library.sanity.studio/",
    "label": "Open Sanity"
  },
  {
    "id": "github",
    "group": "website",
    "name": "GitHub",
    "purpose": "Keeps the website files and a history of changes. It checks an update and prepares a preview. A proposed change waiting to be saved is called a pull request.",
    "signin": "The library has its own GitHub account. After you approve the preview, the save goes through GitHub to Cloudflare.",
    "href": "https://github.com/librarycottonwood/cottonwood-library-assistant",
    "label": "Open GitHub"
  },
  {
    "id": "cloudflare",
    "group": "website",
    "name": "Cloudflare",
    "purpose": "Runs the new library website so visitors can open it. It also provides Turnstile, the spam check on the newsletter signup form.",
    "signin": "Has its own library account. GitHub sends approved website updates here; Cloudflare puts them online.",
    "href": "https://dash.cloudflare.com/",
    "label": "Open Cloudflare"
  },
  {
    "id": "squarespace",
    "group": "website",
    "name": "Squarespace",
    "purpose": "Manages the library’s web address, cottonwoodcommunitylibrary.com. This is where its registration is renewed and where the address is pointed to the website.",
    "signin": "Has its own sign-in. Squarespace, Square and Cloudflare are different services; Todd manages the web-address account.",
    "href": "https://account.squarespace.com/",
    "label": "Open Squarespace"
  },
  {
    "id": "analytics",
    "group": "website",
    "name": "Google Analytics",
    "purpose": "Counts visits to the new website and shows which pages people read. Ask ChatGPT for these reports through its Library Analytics connection.",
    "signin": "Uses the library’s Google account. Google Cloud supports the report connection; it is part of the Google setup, not another website editor.",
    "href": "https://analytics.google.com/",
    "label": "Open Google Analytics"
  },
  {
    "id": "givebutter",
    "group": "communications",
    "name": "Givebutter",
    "purpose": "Holds donation records, fundraisers and newsletter subscribers. Engage is the email section inside Givebutter, where the newsletter is sent.",
    "signin": "Givebutter and Engage use the same account. ChatGPT can read donation reports and write an email; you send that email from Engage.",
    "href": "https://dashboard.givebutter.com/",
    "label": "Open Givebutter"
  },
  {
    "id": "buffer",
    "group": "communications",
    "name": "Buffer",
    "purpose": "Holds social posts before they go out. ChatGPT can put a Facebook draft here for you to review, publish or schedule.",
    "signin": "Buffer has its own sign-in and connects to the library’s social pages. The post appears on Facebook after it is published.",
    "href": "https://publish.buffer.com/",
    "label": "Open Buffer"
  },
  {
    "id": "social",
    "group": "communications",
    "name": "Facebook & Instagram",
    "purpose": "The library’s public social pages, where people see posts and respond. A social post is separate from a news item on the library website.",
    "signin": "Facebook Page access comes through a personal Facebook account added to the Page. Instagram has a separate sign-in; Todd can help with access.",
    "href": "https://www.facebook.com/",
    "label": "Open Facebook"
  },
  {
    "id": "drive",
    "group": "communications",
    "name": "Google Drive",
    "purpose": "Keeps shared files such as photos, working documents and newsletter PDFs. Download a file here when you want to attach it to a ChatGPT request.",
    "signin": "Uses a Google account. Open a shared folder with the account that received its invitation.",
    "href": "https://drive.google.com/",
    "label": "Open Google Drive"
  },
  {
    "id": "gmail",
    "group": "communications",
    "name": "Gmail",
    "purpose": "The inbox for the library’s Google account, including messages about its online services. Google Drive uses the same Google sign-in.",
    "signin": "Gmail is separate from the library’s regular contact mailbox. Todd has the sign-in details for each inbox.",
    "href": "https://mail.google.com/",
    "label": "Open Gmail"
  },
  {
    "id": "catalog",
    "group": "other",
    "name": "Follett Destiny",
    "purpose": "The library’s book catalog and circulation system. This is where books are looked up and staff handle borrowing, rather than in the website editor.",
    "signin": "Has its own staff sign-in. A circulation volunteer can show you the checkout screens and the account to use.",
    "href": "https://cottonlib.follettdestiny.com/",
    "label": "Open Follett Destiny"
  },
  {
    "id": "square",
    "group": "other",
    "name": "Square",
    "purpose": "The service used for the earlier library website at cottonwood-community-library.square.site. It is separate from Squarespace, which manages the web address.",
    "signin": "The older site has its own account. Changes to the new Cloudflare website do not update this one.",
    "href": "https://cottonwood-community-library.square.site/",
    "label": "View the older Square site"
  },
  {
    "id": "spaceship",
    "group": "other",
    "name": "Spaceship",
    "purpose": "An account created while considering a move of the library’s web address. The recorded setup did not transfer the address; Squarespace still manages it.",
    "signin": "An unused account in the platform records, not a step in the website-update process. Todd holds its account details.",
    "href": "https://www.spaceship.com/",
    "label": "Open Spaceship"
  }
];
export const lessons: Lesson[] = [
  {
    slug: 'start-here', title: 'Using ChatGPT',
    summary: 'Start a conversation, attach a file and ask for changes.',
    parts: [
      {
        title: 'Open a conversation',
        text: ['Use ChatGPT to write an announcement, read a flyer or update the library website. Just type what you want help with.'],
        steps: [
          'Open chatgpt.com and sign in to the library’s account.',
          'Click New chat. To change the website, choose Work at the top. For a question or help with writing, choose Chat.',
          'Type a message and send it. If ChatGPT asks a question, type your answer in the same box.',
        ],
        prompt: 'Help me write an announcement for the library. Ask me what it is about.',
      },
      {
        title: 'You can change the answer',
        text: ['Reply with what you want changed: “Make it shorter,” “Use simpler words,” or “Add that admission is free.” You can keep going until the wording is right.', 'Check names, dates and times before using the answer. Tell ChatGPT if it gets something wrong.'],
      },
      {
        title: 'Add a photo, flyer or newsletter',
        text: ['Click the + or paperclip beside the message box and choose your file. Then type what you want ChatGPT to do with it.'],
        prompt: 'Read this flyer and pull out the event name, date, time and location. Show me what you found.',
      },
      {
        title: 'Find an earlier conversation',
        text: ['Your earlier conversations are listed on the left. Click one to pick up where you left off. If the list is hidden, open the menu at the top left.', 'Keep changes to the same announcement in the same conversation, so ChatGPT has the earlier details.'],
        links: [{ label: 'More about using ChatGPT', href: 'https://learn.chatgpt.com/docs/use-chatgpt' }],
      },
    ],
  },
  {
    slug: 'accounts-and-tools', title: 'Accounts and websites',
    summary: 'What each service does, how it connects to the others, and where to sign in.',
    parts: [
      {
        title: 'Need help signing in?',
        text: ['Ask Todd which email address to use and how to get access. Each website has its own sign-in; being signed in to ChatGPT does not sign you in everywhere else.'],
      },
    ],
  },
  {
    slug: 'preview-and-save', title: 'Changing the website',
    summary: 'Add an event, correct a page or upload the newsletter.',
    parts: [
      {
        id: 'add-event', title: 'Add an event',
        text: ['Open ChatGPT, click New chat and choose Work. Type the event details or attach a flyer.'],
        prompt: 'Add an event to the library website. Ask me for the details you need.',
        steps: [
          'Give the event’s name, date, start and end times, location and any cost. Attach a photo if you want one on the page.',
          'Read the wording ChatGPT writes. Reply with any corrections.',
          'Open the preview link. It shows how the page will look on the website.',
          'When it looks right and ChatGPT asks “Ready to save?”, reply “Yes, save it.” Then open the website link it gives you.',
        ],
      },
      {
        id: 'correct-page', title: 'Fix something on a page',
        text: ['Open the page you want to change and copy its address from the browser. Paste it into ChatGPT, then say which words, dates or pictures need changing.', 'To change the opening hours, give the days and new times. If the library is closing for just one day, ask for a closure notice instead.'],
        prompt: 'On this page, change [old wording] to [new wording]: [page link].',
      },
      {
        id: 'newsletter-pdf', title: 'Put the new newsletter on the website',
        text: ['In ChatGPT, choose Work and attach the newsletter PDF. Ask to put it on the website.'],
        prompt: 'Put this newsletter on the website as the latest issue. Keep the older newsletters available too.',
        steps: ['Review the title and description.', 'Open the preview and click the newsletter to check that the right PDF opens.', 'Tell ChatGPT to save it. Keep the finished page’s link if you will also email the newsletter.'],
      },
      {
        title: 'Check the preview before saving',
        text: ['The preview link lets you see your changes before visitors do. Check the page, then tell ChatGPT if you want anything changed.', 'When it looks right, reply “Yes, save it.” If ChatGPT says someone else’s changes will be saved too, check those before saying yes.'],
      },
    ],
  },
  {
    slug: 'everyday-jobs', title: 'Email, Facebook and donations',
    summary: 'Send the newsletter, share a post and record a donation.',
    parts: [
      {
        id: 'send-newsletter', title: 'Email the newsletter',
        text: ['Ask ChatGPT to write the email, then copy it into Givebutter to send. Put the newsletter on the website first so you have a link to include.'],
        prompt: 'Write a short email introducing this newsletter: [newsletter link]. Include a subject line and a link to read the issue.',
        steps: [
          'Open Givebutter on a computer. Choose Engage, then Emails, then New Email.',
          'Choose a template. Copy the subject and message from ChatGPT into the email, including the newsletter link.',
          'Click Next to choose who gets the email. Select the Library Newsletter tag to send it to newsletter subscribers.',
          'Check the message and the list of people receiving it. Click Send now, then Send. Or choose Schedule for later.',
        ],
        links: [{ label: 'Open Givebutter', href: 'https://dashboard.givebutter.com/' }, { label: 'Givebutter’s email instructions', href: 'https://help.givebutter.com/en/articles/6523588-how-to-create-an-outbound-email' }],
      },
      {
        id: 'subscribers', title: 'See who has signed up for the newsletter',
        text: ['In Givebutter, open Contacts. Choose Filter, then Tags, and select Library Newsletter. People who sign up through the website are added to this group.', 'To find one person, search for their email address. The newsletter list only includes subscribers; it is not a list of everyone who uses the library.'],
      },
      {
        id: 'facebook', title: 'Make a Facebook post',
        text: ['Paste the link to the event or news you want to share into ChatGPT.'],
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
        text: ['When someone gives the library cash or a check, enter it in Givebutter. If you cannot see New Transaction, ask Todd for access.'],
        steps: [
          'Open Transactions and click New Transaction.',
          'Choose the fundraiser the donation is for. Then find the person’s name, or add them if they are new.',
          'Enter the amount and the date the donation was received. For Payment method, choose Cash or Check. A check entry also has fields for its number and deposit date.',
          'Choose whether to email a receipt and whether the donor’s name and amount should appear publicly. Click Save.',
        ],
        links: [{ label: 'Open Givebutter', href: 'https://dashboard.givebutter.com/' }, { label: 'Givebutter’s cash and check instructions', href: 'https://help.givebutter.com/en/articles/2705864-how-to-add-and-manage-offline-transactions' }],
      },
      {
        id: 'reports', title: 'Ask about donations or website visits',
        text: ['Tell ChatGPT what you want to know and which dates to check.', 'For donation totals, ask how much money was received. Someone clicking Donate does not always mean they made a donation.'],
        prompt: 'For last month, how much did the library receive in donations, how many people visited the website, and which pages were most popular?',
      },
    ],
  },
  {
    slug: 'when-something-goes-wrong', title: 'Closures and website problems',
    summary: 'Post a closure, cancel an event or ask for help with the website.',
    parts: [
      {
        id: 'closure', title: 'The library needs to close for a day',
        text: ['Tell ChatGPT the date and what the closure notice should say. The normal weekly hours will stay the same.'],
        prompt: 'The library will be closed on [date] because [reason]. Add a notice to the website for that day.',
        steps: ['Review the notice and website preview, then tell ChatGPT to save it.', 'If you also want a Facebook announcement, say “Write a Facebook post about this closure too.” Review that draft in Buffer.'],
      },
      {
        id: 'cancel-event', title: 'An event is canceled or rescheduled',
        text: ['Paste the event link into ChatGPT and say which date is changing. If it happens every week, say whether you mean just this week or all future dates.'],
        prompt: 'Cancel the [event name] session on [date]. Leave the other dates as they are.',
      },
      {
        id: 'wrong-page', title: 'The website still shows the old information',
        text: ['Reload the page. If the old information is still there, go back to the conversation where you asked for the change. Paste the page link and say what is still wrong.'],
        prompt: 'This page still has the old hours: [page link]. The hours should be [new hours]. Can you check and finish the update?',
      },
      {
        id: 'broken-link', title: 'A page or button does not work',
        text: ['Copy the page’s address into ChatGPT and describe what you clicked and what happened. For example, “I clicked Donate, but nothing opened.” A screenshot is useful if there is an error message.'],
        prompt: 'The Donate button on this page does not open when I click it: [page link]. Can you find out why?',
      },
      {
        id: 'access', title: 'You cannot get into an account',
        text: ['Ask Todd for help. Tell him which website you are trying to open and what happens when you sign in.', 'If a donor thinks they were charged but Givebutter says the payment failed, ask the person handling donations to check it before trying again.'],
      },
    ],
  },
  {
    slug: 'practice-with-a-buddy', title: 'Examples',
    summary: 'Pick an idea and open it in ChatGPT. It will help you get started.',
    parts: [
      {
        "title": "Turn a flyer into a Facebook post",
        "icon": "image",
        "text": [],
        "prompt": "I have a flyer to share. Ask me to attach it, then turn it into a short Facebook post with the date, place and what people need to know. Give me two different opening lines to choose from."
      },
      {
        "title": "Dream up a book display",
        "icon": "books",
        "text": [],
        "prompt": "Help me come up with five book-display themes. Ask who the display is for and what kinds of books we have. For each idea, suggest a catchy sign and a few types of books to include."
      },
      {
        "title": "Plan a rainy-day activity",
        "icon": "palette",
        "text": [],
        "prompt": "Help me plan a 20-minute library activity using paper, crayons and tape. Ask about the children’s ages and group size, then give me a materials list and simple instructions."
      },
      {
        "title": "Get a book club talking",
        "icon": "chat",
        "text": [],
        "prompt": "Help me prepare questions for a book club. Ask for the book’s title and author, and whether everyone has finished it. Start with an easy opening question, then suggest five discussion questions."
      },
      {
        "title": "Turn notes into a newsletter",
        "icon": "mail",
        "text": [],
        "prompt": "Help me turn my rough notes into a library newsletter. Ask me to paste the notes, then organize them into short sections with useful headings. Point out any details you still need from me."
      },
      {
        "title": "Make a meeting to-do list",
        "icon": "checklist",
        "text": [],
        "prompt": "Turn my meeting notes into a to-do list. Ask me to paste them, then pull out the decisions, jobs, who offered to do them and any deadlines. Mark anything we still need to decide."
      },
      {
        "title": "Write the words for a poster",
        "icon": "poster",
        "text": [],
        "prompt": "Help me write a poster for a library event. Ask for the event details one question at a time. Then give me a short headline, a friendly invitation and the details people need to attend."
      },
      {
        "title": "Invite someone to volunteer",
        "icon": "people",
        "text": [],
        "prompt": "Help me write a welcoming invitation for new volunteers. Ask what we need help with, how much time it takes and how someone can get in touch. Draft a short version for Facebook and a longer one for the newsletter."
      },
      {
        "title": "Say thank you",
        "icon": "heart",
        "text": [],
        "prompt": "Help me write a personal thank-you to someone who helped the library. Ask what they did and what it made possible. Keep it warm, specific and short enough for a card."
      },
      {
        "title": "Share an announcement in Spanish",
        "icon": "languages",
        "text": [],
        "prompt": "Help me make a Spanish version of a library announcement. Ask me to paste it, then translate it into clear, friendly Spanish. Keep the names, dates, times and links as written."
      },
      {
        "title": "Answer a visitor’s question",
        "icon": "reply",
        "text": [],
        "prompt": "Help me reply to a visitor’s question. Ask me to paste the question and tell you the answer or facts I know. Draft a friendly reply, and ask me about anything that is still unclear."
      },
      {
        "title": "Plan a week of Facebook posts",
        "icon": "calendar",
        "text": [],
        "prompt": "Help me plan three Facebook posts for the library this week. Ask what is happening and what photos we have. Suggest a posting order, then write a caption and photo idea for each post."
      },
      {
        "title": "Freshen up a website page",
        "icon": "pencil",
        "text": [],
        "prompt": "Help me improve a library website page. Ask for the page link and what feels out of date or hard to understand. Show me suggested wording so I can decide what to change."
      },
      {
        "title": "Make sense of a report",
        "icon": "chart",
        "text": [],
        "prompt": "Help me understand a report. Ask me to upload it or paste the figures and say what I want to find out. Explain the main changes in plain language and suggest three useful questions to discuss with the board."
      },
      {
        "title": "Get ready for an event",
        "icon": "clipboard",
        "text": [],
        "prompt": "Help me make a checklist for a library event. Ask what the event is, when it happens and how many volunteers can help. Organize the jobs into before, during and after the event."
      },
      {
        "title": "Practice adding an event",
        "icon": "practice",
        "text": [],
        "prompt": "Let’s practice. Show me an example without changing the website or sending anything. Walk me through adding a fictional book sale to the website. Ask me one question at a time, then show me the event description."
      }
    ],
  },
];
export const quickReference = [
  ['Add an event', 'In ChatGPT: “Add an event to the website.” Give it the name, date, start and end times, location and cost.'],
  ['Correct a page', 'Paste the page link into ChatGPT and say what to change. Open the preview, then reply “Yes, save it” when it is right.'],
  ['Upload the newsletter', 'Attach the PDF in ChatGPT and say “Put this on the website as the latest newsletter.”'],
  ['Email the newsletter', 'Ask ChatGPT to write the email. In Givebutter, open Engage → Emails → New Email. Paste the email and select Library Newsletter under Tags.'],
  ['Find newsletter subscribers', 'In Givebutter, open Contacts → Filter → Tags → Library Newsletter.'],
  ['Record cash or a check', 'In Givebutter, open Transactions → New Transaction. Choose the fundraiser and the person’s name, enter the amount and date, select Cash or Check, then save.'],
  ['Post on Facebook', 'Ask ChatGPT to write the post and put the draft in Buffer. Open Buffer → Publish → Drafts to review and publish it.'],
  ['Announce a closure', 'In ChatGPT: “The library is closed on [date] because [reason]. Add a website notice for that day.”'],
];
