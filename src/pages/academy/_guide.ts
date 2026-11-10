// Shared content for the academy and printable handbook.
export const reviewed = "November 9, 2026";
export const academyUrl = "https://www.cottonwoodcommunitylibrary.com/academy/";
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
  {
    "id": "website",
    "title": "Website and assistant"
  },
  {
    "id": "communications",
    "title": "Donations, social posts and files"
  },
  {
    "id": "other",
    "title": "Other library accounts"
  }
];
export const services = [
  {
    "id": "chatgpt",
    "group": "website",
    "name": "ChatGPT",
    "purpose": "Ask for website updates, write announcements and get help with library tasks.",
    "signin": "Use the library’s ChatGPT account. It has the library’s tools and instructions.",
    "href": "https://chatgpt.com/",
    "label": "Open ChatGPT"
  },
  {
    "id": "codex",
    "group": "website",
    "name": "Codex",
    "purpose": "Changes how the website looks and works. This academy was built with Codex.",
    "signin": "Uses the ChatGPT account. The library’s workspace is called cottonwood-library-editor.",
    "href": "https://chatgpt.com/codex/cloud",
    "label": "Open Codex"
  },
  {
    "id": "sanity",
    "group": "website",
    "name": "Sanity",
    "purpose": "Keeps the events, hours, news, photos and newsletters that appear on the website.",
    "signin": "The library signs in through GitHub. ChatGPT can update the content here for you.",
    "href": "https://cottonwood-community-library.sanity.studio/",
    "label": "Open Sanity"
  },
  {
    "id": "github",
    "group": "website",
    "name": "GitHub",
    "purpose": "Keeps the website files and a record of changes. It also prepares the preview you check before saving.",
    "signin": "Uses the library’s GitHub account. A proposed update is called a pull request.",
    "href": "https://github.com/librarycottonwood/cottonwood-library-assistant",
    "label": "Open GitHub"
  },
  {
    "id": "cloudflare",
    "group": "website",
    "name": "Cloudflare",
    "purpose": "Keeps the library website online. Its Turnstile tool also checks for spam on the newsletter signup form.",
    "signin": "Uses its own library account. GitHub sends approved website updates here.",
    "href": "https://dash.cloudflare.com/",
    "label": "Open Cloudflare"
  },
  {
    "id": "squarespace",
    "group": "website",
    "name": "Squarespace",
    "purpose": "Manages the library’s web address, cottonwoodcommunitylibrary.com, and its renewal.",
    "signin": "Uses its own account, managed by Todd. Squarespace and Square are different services.",
    "href": "https://account.squarespace.com/",
    "label": "Open Squarespace"
  },
  {
    "id": "analytics",
    "group": "website",
    "name": "Google Analytics",
    "purpose": "Shows how many people visit the website and which pages they read.",
    "signin": "Uses the library’s Google account. Google Cloud connects these reports to ChatGPT.",
    "href": "https://analytics.google.com/",
    "label": "Open Google Analytics"
  },
  {
    "id": "givebutter",
    "group": "communications",
    "name": "Givebutter",
    "purpose": "Keeps donations, fundraisers and the newsletter mailing list. Its Engage section sends emails.",
    "signin": "Givebutter and Engage share one account. ChatGPT helps write the email; you send it in Engage.",
    "href": "https://dashboard.givebutter.com/",
    "label": "Open Givebutter"
  },
  {
    "id": "buffer",
    "group": "communications",
    "name": "Buffer",
    "purpose": "Keeps Facebook posts ready for you to check, publish or schedule.",
    "signin": "Uses its own account, connected to the library’s social pages.",
    "href": "https://publish.buffer.com/",
    "label": "Open Buffer"
  },
  {
    "id": "social",
    "group": "communications",
    "name": "Facebook & Instagram",
    "purpose": "The library’s social pages, where people read posts and leave comments.",
    "signin": "Facebook access comes through your own Facebook account. Instagram has a separate sign-in. Todd can help.",
    "href": "https://www.facebook.com/",
    "label": "Open Facebook"
  },
  {
    "id": "drive",
    "group": "communications",
    "name": "Google Drive",
    "purpose": "Stores shared photos, documents and newsletters. Download a file here to attach it in ChatGPT.",
    "signin": "Use the Google account that was invited to the shared folder.",
    "href": "https://drive.google.com/",
    "label": "Open Google Drive"
  },
  {
    "id": "gmail",
    "group": "communications",
    "name": "Gmail",
    "purpose": "Email for the library’s Google account, including messages about these services.",
    "signin": "Uses the same Google sign-in as Drive. This is separate from the library’s usual contact inbox.",
    "href": "https://mail.google.com/",
    "label": "Open Gmail"
  },
  {
    "id": "catalog",
    "group": "other",
    "name": "Follett Destiny",
    "purpose": "Look up books and handle borrowing and returns.",
    "signin": "Uses a separate staff account. A circulation volunteer can show you how to sign in.",
    "href": "https://cottonlib.follettdestiny.com/",
    "label": "Open Follett Destiny"
  },
  {
    "id": "square",
    "group": "other",
    "name": "Square",
    "purpose": "The service behind the library’s older Square website.",
    "signin": "Uses a separate account. Updating the current website does not change the older one.",
    "href": "https://cottonwood-community-library.square.site/",
    "label": "View the older Square site"
  },
  {
    "id": "spaceship",
    "group": "other",
    "name": "Spaceship",
    "purpose": "An account set up while considering a move of the library’s web address. The address stayed with Squarespace.",
    "signin": "Not used for website updates. Todd has the account details.",
    "href": "https://www.spaceship.com/",
    "label": "Open Spaceship"
  }
];
export const lessons: Lesson[] = [
  {
    "slug": "start-here",
    "title": "Using ChatGPT",
    "summary": "Start a conversation, attach a file and ask for changes.",
    "parts": [
      {
        "title": "Open a conversation",
        "text": [
          "Tell ChatGPT what you need, just as you would ask someone for help."
        ],
        "steps": [
          "Open chatgpt.com and sign in to the library’s account.",
          "Click New chat. Choose Work for website changes, or Chat for writing and questions.",
          "Type your request. Answer any questions in the same conversation."
        ],
        "prompt": "Help me write an announcement for the library. Ask me what it is about."
      },
      {
        "title": "Ask for changes",
        "text": [
          "Reply with “Make it shorter” or “Use simpler words.” Keep going until it says what you mean.",
          "Check names, dates and times before using it."
        ]
      },
      {
        "title": "Add a photo, flyer or newsletter",
        "text": [
          "Click the + or paperclip beside the message box. Choose your file, then say what you want help with."
        ],
        "prompt": "Read this flyer and list the event name, date, time and place."
      },
      {
        "title": "Continue an earlier chat",
        "text": [
          "Choose the conversation from the list on the left. If the list is hidden, open the menu at the top left.",
          "Use the same chat when you want to change something you were already working on."
        ],
        "links": [
          {
            "label": "More about using ChatGPT",
            "href": "https://learn.chatgpt.com/docs/use-chatgpt"
          }
        ]
      }
    ]
  },
  {
    "slug": "accounts-and-tools",
    "title": "Accounts and websites",
    "summary": "What each website does and how to sign in.",
    "parts": [
      {
        "title": "Need help signing in?",
        "text": [
          "Ask Todd which account to use. Signing in to ChatGPT does not sign you in to the other websites."
        ]
      }
    ]
  },
  {
    "slug": "preview-and-save",
    "title": "Update the website",
    "summary": "Add an event, correct a page or upload the newsletter.",
    "parts": [
      {
        "id": "add-event",
        "title": "Add an event",
        "text": [
          "Open a new chat, choose Work and describe the event. You can attach a flyer."
        ],
        "prompt": "Add an event to the library website. Ask me for the details you need.",
        "steps": [
          "Give the name, date, start and end times, place and cost. Add a photo if you have one.",
          "Read the draft and ask for any changes.",
          "Open the preview to see how it will look on the website.",
          "When ChatGPT asks “Ready to save?”, say “Yes, save it.” Then open the finished page."
        ]
      },
      {
        "id": "correct-page",
        "title": "Fix something on a page",
        "text": [
          "Copy the page’s link into ChatGPT. Say what needs changing.",
          "For new opening hours, give the days and times. For a one-day closure, ask for a closure notice."
        ],
        "prompt": "Change [old wording] to [new wording] on this page: [page link]."
      },
      {
        "id": "newsletter-pdf",
        "title": "Add the newsletter",
        "text": [
          "Choose Work in ChatGPT and attach the newsletter PDF."
        ],
        "prompt": "Add this as the latest newsletter on the website. Keep the older issues too.",
        "steps": [
          "Check the title and description.",
          "Open the preview. Click the newsletter to check that the right file opens.",
          "Ask ChatGPT to save it. Keep the page link for your newsletter email."
        ]
      },
      {
        "title": "What is a preview?",
        "text": [
          "A preview shows your changes before they go live. Open it and check that everything looks right.",
          "If ChatGPT says the save includes someone else’s changes, check those too before saying yes."
        ]
      }
    ]
  },
  {
    "slug": "everyday-jobs",
    "title": "Email, posts and donations",
    "summary": "Send the newsletter, share a post and record a donation.",
    "parts": [
      {
        "id": "send-newsletter",
        "title": "Email the newsletter",
        "text": [
          "Add the newsletter to the website first. Then ask ChatGPT to write an email with a link to it."
        ],
        "prompt": "Write a short email introducing this newsletter: [newsletter link]. Include a subject line and a link to read the issue.",
        "steps": [
          "Open Givebutter. Choose Engage, Emails, then New Email.",
          "Choose a template. Paste in the subject, message and newsletter link.",
          "Click Next. Choose the Library Newsletter tag to reach subscribers.",
          "Check the message and recipients. Click Send now, then Send, or choose Schedule for later."
        ],
        "links": [
          {
            "label": "Open Givebutter",
            "href": "https://dashboard.givebutter.com/"
          },
          {
            "label": "Givebutter’s email instructions",
            "href": "https://help.givebutter.com/en/articles/6523588-how-to-create-an-outbound-email"
          }
        ]
      },
      {
        "id": "subscribers",
        "title": "Find newsletter subscribers",
        "text": [
          "In Givebutter, choose Contacts, Filter, Tags, then Library Newsletter.",
          "To find one person, search for their email address. This list contains newsletter subscribers."
        ]
      },
      {
        "id": "facebook",
        "title": "Make a Facebook post",
        "text": [
          "Paste the link to the event or news you want to share into ChatGPT."
        ],
        "prompt": "Write a Facebook post about this: [page link].",
        "steps": [
          "Read the post ChatGPT writes. Ask for any changes.",
          "Ask ChatGPT to put the draft in Buffer.",
          "In Buffer, choose Publish, then Drafts. Open the post and check that it is for the library’s Facebook Page.",
          "Publish it now or schedule it. Scheduled posts appear in Queue; published posts appear in Sent."
        ],
        "links": [
          {
            "label": "Open Buffer",
            "href": "https://publish.buffer.com/"
          },
          {
            "label": "Finding drafts and sent posts in Buffer",
            "href": "https://support.buffer.com/articles/how-to-use-the-all-channels-view-in-buffer-oqqE4Sdf3T"
          }
        ]
      },
      {
        "id": "cash-check",
        "title": "Record a cash or check donation",
        "text": [
          "Enter cash and check donations in Givebutter. Ask Todd for access if you cannot see New Transaction."
        ],
        "steps": [
          "Choose Transactions, then New Transaction.",
          "Choose the fundraiser. Find the donor’s name, or add it.",
          "Enter the amount and date. Choose Cash or Check. For a check, add its number and deposit date.",
          "Choose whether to email a receipt and show the donor’s name and amount publicly. Click Save."
        ],
        "links": [
          {
            "label": "Open Givebutter",
            "href": "https://dashboard.givebutter.com/"
          },
          {
            "label": "Givebutter’s cash and check instructions",
            "href": "https://help.givebutter.com/en/articles/2705864-how-to-add-and-manage-offline-transactions"
          }
        ]
      },
      {
        "id": "reports",
        "title": "Ask for a report",
        "text": [
          "Ask about donations or website visits. Include the dates you want to compare."
        ],
        "prompt": "How much did the library receive in donations last month, and how many people visited the website?"
      }
    ]
  },
  {
    "slug": "when-something-goes-wrong",
    "title": "Closures and problems",
    "summary": "Post a closure, cancel an event or ask for help with the website.",
    "parts": [
      {
        "id": "closure",
        "title": "Close for a day",
        "text": [
          "Give ChatGPT the date and the reason for closing. Your usual weekly hours stay the same."
        ],
        "prompt": "The library will be closed on [date] because [reason]. Add a notice to the website for that day.",
        "steps": [
          "Check the preview, then ask ChatGPT to save it.",
          "Need a Facebook post too? Ask ChatGPT to write one, then check the draft in Buffer."
        ]
      },
      {
        "id": "cancel-event",
        "title": "Cancel or move an event",
        "text": [
          "Paste the event link into ChatGPT and give the new date, or ask to cancel. For a weekly event, say which session you mean."
        ],
        "prompt": "Cancel the [event name] session on [date]. Leave the other dates as they are."
      },
      {
        "id": "wrong-page",
        "title": "An update is missing",
        "text": [
          "Reload the page. If it still looks wrong, return to the chat where you requested the change. Paste the page link and explain what is missing."
        ],
        "prompt": "This page still shows the old hours: [page link]. They should be [new hours]. Can you check?"
      },
      {
        "id": "broken-link",
        "title": "A button or page is broken",
        "text": [
          "Send ChatGPT the page link and say what happened. You can attach a screenshot."
        ],
        "prompt": "The Donate button on this page does not open: [page link]. Can you check what is wrong?"
      },
      {
        "id": "access",
        "title": "You cannot sign in",
        "text": [
          "Ask Todd for help. Tell him which website you are opening and what happens when you try to sign in."
        ]
      }
    ]
  },
  {
    "slug": "practice-with-a-buddy",
    "title": "Examples",
    "summary": "Choose a starting point. ChatGPT will ask for the details.",
    "parts": [
      {
        "title": "Turn a flyer into a Facebook post",
        "icon": "image",
        "text": [],
        "prompt": "Help me turn a flyer into a Facebook post. Ask me to attach it, then give me two versions to choose from."
      },
      {
        "title": "Dream up a book display",
        "icon": "books",
        "text": [],
        "prompt": "Suggest five book-display themes, with a sign for each. First ask who the display is for and what books we have."
      },
      {
        "title": "Plan a rainy-day activity",
        "icon": "palette",
        "text": [],
        "prompt": "Plan a 20-minute activity using paper, crayons and tape. Ask the children’s ages and group size first."
      },
      {
        "title": "Get a book club talking",
        "icon": "chat",
        "text": [],
        "prompt": "Help me prepare six book-club questions. Ask which book we are reading and whether everyone has finished it."
      },
      {
        "title": "Turn notes into a newsletter",
        "icon": "mail",
        "text": [],
        "prompt": "Turn my notes into a short library newsletter. Ask me to paste them, then help me fill in any missing details."
      },
      {
        "title": "Make a meeting to-do list",
        "icon": "checklist",
        "text": [],
        "prompt": "Turn my meeting notes into a to-do list with names and deadlines. Ask me to paste the notes first."
      },
      {
        "title": "Write the words for a poster",
        "icon": "poster",
        "text": [],
        "prompt": "Help me write an event poster. Ask for the details one question at a time, then suggest a headline and short invitation."
      },
      {
        "title": "Invite someone to volunteer",
        "icon": "people",
        "text": [],
        "prompt": "Help me invite new volunteers. Ask about the jobs, time commitment and how to get in touch. Write a Facebook post and newsletter paragraph."
      },
      {
        "title": "Say thank you",
        "icon": "heart",
        "text": [],
        "prompt": "Help me write a short thank-you card. Ask who it is for and how they helped the library."
      },
      {
        "title": "Share an announcement in Spanish",
        "icon": "languages",
        "text": [],
        "prompt": "Translate my announcement into friendly Spanish. Ask me to paste it. Keep the names, dates, times and links unchanged."
      },
      {
        "title": "Answer a visitor’s question",
        "icon": "reply",
        "text": [],
        "prompt": "Help me answer a visitor’s question. Ask for their question and the facts I know, then draft a friendly reply."
      },
      {
        "title": "Plan a week of Facebook posts",
        "icon": "calendar",
        "text": [],
        "prompt": "Plan three Facebook posts for this week. Ask what is happening and what photos we have, then suggest captions and a posting order."
      },
      {
        "title": "Freshen up a website page",
        "icon": "pencil",
        "text": [],
        "prompt": "Help me rewrite a website page. Ask for the link and what needs changing, then show me a draft."
      },
      {
        "title": "Make sense of a report",
        "icon": "chart",
        "text": [],
        "prompt": "Explain a report in plain language. Ask me to share it and what I want to know, then summarize the main points."
      },
      {
        "title": "Get ready for an event",
        "icon": "clipboard",
        "text": [],
        "prompt": "Make a checklist for an event. Ask about the event and volunteers, then list jobs for before, during and after."
      },
      {
        "title": "Practice adding an event",
        "icon": "practice",
        "text": [],
        "prompt": "Let’s practice adding a fictional book sale, without changing the website or sending anything. Ask me one question at a time, then show me the event description."
      }
    ]
  }
];
export const quickReference = [
  [
    "Add an event",
    "In ChatGPT: “Add an event to the website.” Give it the name, date, start and end times, location and cost."
  ],
  [
    "Correct a page",
    "Paste the page link into ChatGPT and say what to change. Open the preview, then reply “Yes, save it” when it is right."
  ],
  [
    "Upload the newsletter",
    "Attach the PDF in ChatGPT and say “Put this on the website as the latest newsletter.”"
  ],
  [
    "Email the newsletter",
    "Ask ChatGPT to write the email. In Givebutter, open Engage → Emails → New Email. Paste the email and select Library Newsletter under Tags."
  ],
  [
    "Find newsletter subscribers",
    "In Givebutter, open Contacts → Filter → Tags → Library Newsletter."
  ],
  [
    "Record cash or a check",
    "In Givebutter, open Transactions → New Transaction. Choose the fundraiser and the person’s name, enter the amount and date, select Cash or Check, then save."
  ],
  [
    "Post on Facebook",
    "Ask ChatGPT to write the post and put the draft in Buffer. Open Buffer → Publish → Drafts to review and publish it."
  ],
  [
    "Announce a closure",
    "In ChatGPT: “The library is closed on [date] because [reason]. Add a website notice for that day.”"
  ]
];
