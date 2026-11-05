// Public lessons. Account names and sign-in details are in assistant/ACCOUNT-REGISTER.md.
// The website and printable handbook use this same text.
export const reviewed = 'November 5, 2026';
export const academyUrl = 'https://cottonwood-library.pages.dev/academy/';
export const practicePrefix = "Let’s practice. Show me an example without changing the website or sending anything. ";
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
  {
    "id": "chatgpt",
    "name": "ChatGPT",
    "purpose": "Write announcements, read flyers and ask for website changes.",
    "signin": "Use the library’s ChatGPT account.",
    "href": "https://chatgpt.com/",
    "label": "Open ChatGPT"
  },
  {
    "id": "givebutter",
    "name": "Givebutter",
    "purpose": "Record donations, find newsletter subscribers and send the newsletter.",
    "signin": "Use your Givebutter sign-in for the library.",
    "href": "https://dashboard.givebutter.com/",
    "label": "Open Givebutter"
  },
  {
    "id": "drive",
    "name": "Google Drive",
    "purpose": "Find shared photos, newsletters and other library files.",
    "signin": "Use the Google account that was invited to the shared folder.",
    "href": "https://drive.google.com/",
    "label": "Open Google Drive"
  },
  {
    "id": "email",
    "name": "Email",
    "purpose": "Read and reply to library messages.",
    "signin": "For the library’s regular mail, open its mail app. The library’s Gmail account has a separate inbox.",
    "href": "https://mail.google.com/",
    "label": "Open Gmail"
  },
  {
    "id": "buffer",
    "name": "Buffer",
    "purpose": "Review Facebook posts and choose when to publish them.",
    "signin": "Sign in to Buffer to post. For Facebook itself, use your own account with access to the library Page.",
    "href": "https://publish.buffer.com/",
    "label": "Open Buffer"
  },
  {
    "id": "website",
    "name": "Library website",
    "purpose": "See the events, hours and newsletters that visitors see.",
    "signin": "No sign-in needed. Ask ChatGPT when you want to change something.",
    "href": "https://cottonwood-library.pages.dev/",
    "label": "Open the website"
  },
  {
    "id": "catalog",
    "name": "Book catalog",
    "purpose": "Look up a book in the library’s collection.",
    "signin": "For checking books in or out, ask a circulation volunteer to show you the staff sign-in.",
    "href": "https://cottonlib.follettdestiny.com/",
    "label": "Find a book"
  },
  {
    "id": "zoom",
    "name": "Zoom",
    "purpose": "Join an online library meeting.",
    "signin": "Click the Zoom link in your meeting invitation. It has the meeting details you need.",
    "href": "https://zoom.us/join",
    "label": "Join a meeting"
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
        links: [{ label: 'Open ChatGPT', href: 'https://chatgpt.com/' }],
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
    summary: 'Where to go and what to use it for.',
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
        prompt: 'This page still has the old hours: [page link]. I asked you to change them earlier in this conversation. Can you finish the update?',
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
    slug: 'practice-with-a-buddy', title: 'Try it in ChatGPT',
    summary: 'Try writing an announcement or reading a flyer with ChatGPT.',
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
        title: 'Practice adding an event',
        text: ['Try this with made-up details. ChatGPT will ask about your event and write an example description.'],
        prompt: practicePrefix + 'Walk me through adding a book sale to the website. Ask me one question at a time, then show me the event description.',
      },
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
