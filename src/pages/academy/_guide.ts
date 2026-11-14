// Shared content for the academy and printable handbook.
export const reviewed = "November 13, 2026";
export const academyUrl = "https://www.cottonwoodcommunitylibrary.com/academy/";
export interface Part {
  id?: string;
  icon?: string;
  screenshots?: { framing?: 'full'; beforeStep?: number; afterParagraph?: number; key: string; alt: string; caption?: string; view: 'navigation' | 'message' | 'modes' | 'attachment' | 'helper' | 'website-request' | 'newsletter' | 'buffer-queue' | 'buffer-editor' | 'buffer-timing' | 'buffer-channels' | 'buffer-connect' | 'tour-sidebar' | 'tour-scheduled' | 'tour-library' | 'tour-plugins' | 'tour-explore' | 'tour-account' | 'givebutter-email' | 'givebutter-templates' | 'givebutter-subscribers' | 'givebutter-donation' }[];
  title: string;
  text: string[];
  items?: { label: string; text: string }[];
  steps?: string[];
  prompt?: string;
  links?: { label: string; href: string }[];
}
export interface Lesson { slug: string; title: string; summary: string; parts: Part[]; }
export const academyGroups = [
  {
    "id": "start",
    "title": "Start here",
    "slugs": [
      "start-here",
      "chatgpt-tour",
      "files-and-links",
      "library-assistant"
    ]
  },
  {
    "id": "tasks",
    "title": "Library tasks",
    "slugs": [
      "preview-and-save",
      "everyday-jobs",
      "facebook-posts",
      "when-something-goes-wrong",
      "practice-with-a-buddy",
      "accounts-and-tools"
    ]
  },
  {
    "id": "reference",
    "title": "Behind the scenes",
    "slugs": [
      "website-systems",
      "automatic-repairs"
    ]
  }
];
export const serviceGroups = [
  {
    "id": "daily",
    "title": "Websites for library tasks"
  },
  {
    "id": "technical",
    "title": "Website and reporting systems"
  }
];
export const services = [
  {
    "id": "chatgpt",
    "group": "daily",
    "name": "ChatGPT",
    "purpose": "Ask for website updates, write announcements and get help with library tasks.",
    "href": "https://chatgpt.com/",
    "label": "Open ChatGPT"
  },
  {
    "id": "codex",
    "group": "technical",
    "name": "Codex",
    "purpose": "Changes the website’s design and how its features work.",
    "href": "https://chatgpt.com/codex/cloud",
    "label": "Open Codex"
  },
  {
    "id": "sanity",
    "group": "technical",
    "name": "Sanity",
    "purpose": "Keeps the events, hours, news, photos and newsletters that appear on the website.",
    "href": "https://cottonwood-community-library.sanity.studio/",
    "label": "Open Sanity"
  },
  {
    "id": "github",
    "group": "technical",
    "name": "GitHub",
    "purpose": "Keeps the website files and a record of changes. It also prepares the preview you check before saving.",
    "href": "https://github.com/librarycottonwood/cottonwood-library-assistant",
    "label": "Open GitHub"
  },
  {
    "id": "cloudflare",
    "group": "technical",
    "name": "Cloudflare",
    "purpose": "Hosts the library website and protects the newsletter signup form from spam.",
    "href": "https://dash.cloudflare.com/",
    "label": "Open Cloudflare"
  },
  {
    "id": "squarespace",
    "group": "technical",
    "name": "Squarespace",
    "purpose": "Manages the library’s web address, cottonwoodcommunitylibrary.com, and its renewal.",
    "href": "https://account.squarespace.com/",
    "label": "Open Squarespace"
  },
  {
    "id": "analytics",
    "group": "technical",
    "name": "Google Analytics",
    "purpose": "Shows how many people visit the website and which pages they read.",
    "href": "https://analytics.google.com/",
    "label": "Open Google Analytics"
  },
  {
    "id": "google-cloud",
    "group": "technical",
    "name": "Google Cloud",
    "purpose": "Connects Google Analytics reports to ChatGPT.",
    "href": "https://console.cloud.google.com/",
    "label": "Open Google Cloud"
  },
  {
    "id": "givebutter",
    "group": "daily",
    "name": "Givebutter",
    "purpose": "Keeps donations, fundraisers and the newsletter mailing list. Its Engage section sends emails.",
    "href": "https://dashboard.givebutter.com/",
    "label": "Open Givebutter"
  },
  {
    "id": "buffer",
    "group": "daily",
    "name": "Buffer",
    "purpose": "Keeps Facebook posts ready for you to check, publish or schedule.",
    "href": "https://publish.buffer.com/",
    "label": "Open Buffer"
  }
];
export const lessons: Lesson[] = [
  {
    "slug": "start-here",
    "title": "Your first chat",
    "summary": "Send your first message, read the reply and ask for changes.",
    "parts": [
      {
        "id": "what-is-chatgpt",
        "title": "What can ChatGPT help with?",
        "text": [
          "ChatGPT can draft a message, explain something or help with a library task. Type what you need in the message box.",
          "A conversation is called a chat. Your messages and ChatGPT’s replies stay together, so you can ask follow-up questions."
        ]
      },
      {
        "id": "first-message",
        "title": "Send your first message",
        "text": [],
        "steps": [
          "Open chatgpt.com in your browser. Sign in to the library’s account if asked.",
          "Choose New chat. Leave Chat selected at the top. Click in the message box and type what you need.",
          "Click the green Send arrow beside the message box. Wait for the reply to appear.",
          "Read the reply. If ChatGPT asks a question, type your answer in the same box and send it."
        ],
        "prompt": "Help me write a short thank-you note for a library volunteer. Ask me one question at a time.",
        "screenshots": [
          {
            "key": "academyChatgptWindow",
            "alt": "Full ChatGPT browser window. ChatGPT’s upper-left sidebar, with the New chat button below the search and sidebar icons.",
            "view": "navigation",
            "beforeStep": 2
          },
          {
            "key": "academyChatgptWindow",
            "alt": "Full ChatGPT browser window. A message typed in ChatGPT. The Send button is the green circle with an upward arrow at the bottom right of the message box.",
            "view": "message",
            "beforeStep": 3
          }
        ],
        "links": [
          {
            "label": "Find your way around ChatGPT",
            "href": "/academy/chatgpt-tour/"
          }
        ]
      },
      {
        "id": "follow-up",
        "title": "Ask for a better answer",
        "text": [
          "You can say “Make it shorter,” “That date is wrong,” or “Explain that word.” Reply in the same chat so ChatGPT can see what you mean.",
          "ChatGPT can make mistakes. Compare names, dates, times and library details with the information you supplied before sharing the result."
        ],
        "prompt": "Please explain that in plain language. Give me just the next step, then wait for me."
      }
    ]
  },
  {
    "slug": "chatgpt-tour",
    "title": "Find your way around",
    "summary": "What the tabs, menus and buttons in ChatGPT are for.",
    "parts": [
      {
        "id": "sidebar",
        "title": "New chat, Search and Recents",
        "text": [],
        "items": [
          {
            "label": "New chat",
            "text": "Start a separate conversation for a new question or job."
          },
          {
            "label": "Search",
            "text": "The magnifying glass near the ChatGPT name finds earlier conversations. Search for a word you remember, such as “newsletter.”"
          },
          {
            "label": "Recents",
            "text": "Open this list to return to a recent conversation. Continue there when you want to finish the same job."
          },
          {
            "label": "Show or hide the sidebar",
            "text": "The small panel button beside Search opens or closes this menu. On a narrow screen, open the sidebar to see these choices."
          }
        ],
        "screenshots": [
          {
            "key": "academyChatgptAccountMenu",
            "view": "tour-sidebar",
            "alt": "ChatGPT’s full browser window, focused on the left sidebar with New chat, Search, Scheduled, Library, Plugins, Explore, Projects and Recents."
          }
        ]
      },
      {
        "id": "chat-or-work",
        "title": "Chat or Work?",
        "text": [
          "Use Chat for questions, ideas and writing. Use Work when you want help carrying out a library task, such as updating the website. You can choose between them in ChatGPT.",
          "The Open in ChatGPT buttons in this academy start in Work. They open a new browser tab with the example message ready for you. Read it, change any details, then send it. Replace words in square brackets, such as [date], with your own details.",
          "The ChatGPT name at the top left also opens a choice between ChatGPT and Codex. Codex is for building and changing software. The library’s everyday tasks stay in ChatGPT."
        ],
        "screenshots": [
          {
            "key": "academyChatgptWindow",
            "alt": "Full ChatGPT browser window. The Chat and Work choices at the top of a new ChatGPT conversation. Chat is selected in this screenshot.",
            "view": "modes",
            "afterParagraph": 1
          }
        ]
      },
      {
        "id": "scheduled",
        "title": "Scheduled: tasks for later",
        "text": [
          "Scheduled is where you find reminders and jobs you have asked ChatGPT to repeat. Open a task to see its instructions, timing and recent results."
        ],
        "items": [
          {
            "label": "Schedule a task",
            "text": "Describe the job and when it should happen. For example, ask for a reminder before a meeting."
          },
          {
            "label": "Existing tasks",
            "text": "Review a task before changing its schedule. The date of its next run tells you when it is due, not whether its last run succeeded."
          }
        ],
        "screenshots": [
          {
            "key": "academyChatgptScheduled",
            "view": "tour-scheduled",
            "framing": "full",
            "alt": "ChatGPT Scheduled page with its task entry box and an existing weekly task showing the next run."
          }
        ]
      },
      {
        "id": "library",
        "title": "Library: files and things you create",
        "text": [
          "This is ChatGPT’s Library, where you find saved material from your work. It is separate from the Cottonwood library website."
        ],
        "items": [
          {
            "label": "All",
            "text": "Browse the items in your ChatGPT Library."
          },
          {
            "label": "Images",
            "text": "Find pictures made in ChatGPT. The screenshot shows this tab before any images have been created."
          },
          {
            "label": "Folders",
            "text": "Keep related items together."
          },
          {
            "label": "Favorites",
            "text": "Find items you have marked as favorites."
          },
          {
            "label": "Suggested",
            "text": "See items ChatGPT suggests from your Library."
          },
          {
            "label": "Search library",
            "text": "Find an item by name using the search box at the top."
          }
        ],
        "screenshots": [
          {
            "key": "academyChatgptLibrary",
            "view": "tour-library",
            "framing": "full",
            "alt": "ChatGPT Library with Suggested, Favorites, Folders, Images and All tabs. Images is selected."
          }
        ]
      },
      {
        "id": "plugins",
        "title": "Plugins and Skills: connected tools",
        "text": [
          "Plugins let ChatGPT work with other services. For example, the library’s Buffer connection lets it prepare social posts, and its website tools help it make website updates."
        ],
        "items": [
          {
            "label": "Installed",
            "text": "See the plugins already added to this account. Open one to learn what it does or check its connection."
          },
          {
            "label": "Public and Personal",
            "text": "Browse available plugins or your own plugins. These are directory tabs; a listing does not mean a plugin is connected."
          },
          {
            "label": "Skills",
            "text": "The Skills tab contains instructions that teach ChatGPT how to do particular jobs. ChatGPT uses these to follow the library’s procedures."
          }
        ],
        "screenshots": [
          {
            "key": "academyChatgptPlugins",
            "view": "tour-plugins",
            "framing": "full",
            "alt": "ChatGPT Plugins page with Plugins and Skills tabs, the Installed row, and Public and Personal directory tabs."
          }
        ],
        "links": [
          {
            "label": "ChatGPT for library work",
            "href": "/academy/library-assistant/"
          }
        ]
      },
      {
        "id": "projects",
        "title": "Projects: keep one ongoing job together",
        "text": [
          "A project groups related conversations, files and instructions. You could keep several months of newsletter planning in one project, while starting a separate chat for each issue.",
          "Open Projects in the sidebar and choose a project to return to it. Its Chats area holds conversations; Sources holds the reference material. A quick, one-time question can stay in an ordinary chat."
        ]
      },
      {
        "id": "explore",
        "title": "Explore: other things ChatGPT can do",
        "text": [],
        "items": [
          {
            "label": "Images",
            "text": "Create pictures with ChatGPT."
          },
          {
            "label": "GPTs",
            "text": "Custom versions of ChatGPT. OpenAI is moving these to plugins and retiring custom GPTs. You can skip this section for library work."
          },
          {
            "label": "Sites",
            "text": "Build a separate website with ChatGPT. To update Cottonwood’s existing website, use the Website updates lesson instead."
          },
          {
            "label": "Health, Finances and Maps",
            "text": "Open ChatGPT’s areas for those subjects. They are separate from the library’s connected tools."
          }
        ],
        "screenshots": [
          {
            "key": "academyChatgptExplore",
            "view": "tour-explore",
            "alt": "ChatGPT sidebar with Explore open, showing Health, Finances, Maps, Images, GPTs and Sites."
          }
        ]
      },
      {
        "id": "account-menu",
        "title": "Your account and settings",
        "text": [
          "Click the account name at the bottom left to open this menu."
        ],
        "items": [
          {
            "label": "Personalization",
            "text": "Choose preferences for how ChatGPT responds."
          },
          {
            "label": "Profile",
            "text": "Manage the profile associated with the account."
          },
          {
            "label": "Settings",
            "text": "Find account and app settings."
          },
          {
            "label": "Help",
            "text": "Open ChatGPT’s help resources."
          },
          {
            "label": "Log out",
            "text": "Sign out of the current account."
          }
        ],
        "screenshots": [
          {
            "key": "academyChatgptAccountMenu",
            "view": "tour-account",
            "alt": "ChatGPT account menu at the bottom left, showing Personalization, Profile, Settings, Help and Log out."
          }
        ]
      }
    ]
  },
  {
    "slug": "files-and-links",
    "title": "Photos, files and links",
    "summary": "Give ChatGPT a flyer, document or page to work with.",
    "parts": [
      {
        "id": "attach-file",
        "title": "Add a photo, flyer or newsletter",
        "text": [],
        "steps": [
          "Click the + button beside the message box, then choose Add photos & files.",
          "Choose the photo or document from your computer. Wait for it to appear beside your message.",
          "Type what you want ChatGPT to do with it, then send the message."
        ],
        "prompt": "Read this flyer and list the event name, date, time and place.",
        "screenshots": [
          {
            "key": "academyChatgptMenu",
            "alt": "Full ChatGPT browser window. The plus button has opened a menu. Add photos & files is the first option, marked with a paperclip.",
            "view": "attachment",
            "beforeStep": 1
          }
        ]
      },
      {
        "id": "copy-link",
        "title": "Share a website link",
        "text": [],
        "steps": [
          "Open the page you want help with.",
          "Click its address at the top of your browser. Copy the whole address.",
          "Return to ChatGPT, paste the address into your message and say what you want changed."
        ]
      }
    ]
  },
  {
    "slug": "library-assistant",
    "title": "ChatGPT for library work",
    "summary": "Use ChatGPT for website updates, newsletters and reports.",
    "parts": [
      {
        "id": "library-account",
        "title": "Use the library’s ChatGPT account",
        "text": [
          "ChatGPT is the library’s assistant. Use the library’s account for website updates and reports."
        ],
        "links": [
          {
            "label": "Get technical help",
            "href": "/academy/accounts-and-tools/#sign-in-help"
          }
        ]
      },
      {
        "id": "skills-connections",
        "title": "Ask for library work",
        "text": [
          "Ask it to add an event, post a closure notice or check last month’s donations. It will ask for any details it needs."
        ],
        "screenshots": [
          {
            "key": "academyChatgptMenu",
            "alt": "Full ChatGPT browser window. The Cottonwood tree icon beside Cottonwood Library in ChatGPT’s add menu.",
            "caption": "Cottonwood Library appears in the + menu.",
            "view": "helper"
          }
        ]
      },
      {
        "id": "website-help",
        "title": "Updating the website",
        "text": [
          "Describe the change and check the draft. Open the preview to see how it will look on the website, then say “Yes, save it” when it is ready."
        ],
        "links": [
          {
            "label": "Follow the website update steps",
            "href": "/academy/preview-and-save/"
          }
        ]
      },
      {
        "id": "other-services",
        "title": "Email, Facebook and reports",
        "text": [
          "Ask ChatGPT to write a newsletter email, then send it from Givebutter’s Engage section.",
          "For Facebook, ask ChatGPT to prepare a draft in Buffer. Review the post there and choose when to publish it.",
          "For donation totals or website visits, ask for a report and give the dates."
        ],
        "links": [
          {
            "label": "Newsletters and donations",
            "href": "/academy/everyday-jobs/"
          },
          {
            "label": "Facebook posts",
            "href": "/academy/facebook-posts/"
          }
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
        "screenshots": [
          {
            "key": "academyWebsiteRequest",
            "view": "website-request",
            "alt": "ChatGPT in Work mode, with an unsent request to add an event in the message box and the green Send arrow beside it."
          }
        ],
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
        "screenshots": [
          {
            "key": "academyNewsletter",
            "view": "newsletter",
            "alt": "The library newsletter page with Fall and Summer 2026 issues. Each issue has a title, description, Download PDF link and accessible Word version.",
            "beforeStep": 2
          }
        ],
        "title": "Add the newsletter",
        "text": [
          "Choose Work in ChatGPT and attach the newsletter PDF."
        ],
        "prompt": "Add this as the latest newsletter on the website. Keep the older issues too.",
        "steps": [
          "Check the title and description.",
          "Open the preview. Choose Download PDF under the newsletter to check that the right file opens.",
          "Ask ChatGPT to save it. Keep the page link for your newsletter email."
        ]
      },
      {
        "title": "What is a preview?",
        "text": [
          "A preview shows your changes before they go live. Open it and check that everything looks right.",
          "If ChatGPT says the save includes someone else’s changes, check those too before saying yes."
        ],
        "id": "check-preview"
      }
    ]
  },
  {
    "slug": "everyday-jobs",
    "title": "Newsletters and donations",
    "summary": "Send the newsletter, find subscribers and work with donation records.",
    "parts": [
      {
        "id": "send-newsletter",
        "title": "Email the newsletter",
        "text": [
          "Putting the newsletter on the website and emailing it are two separate jobs. Add it to the website first, then ask ChatGPT to write the email.",
          "You send the email in Engage, the email section of Givebutter. Use a computer for these steps."
        ],
        "prompt": "Write a short email introducing this newsletter: [newsletter link]. Include a subject line and a link to read the issue.",
        "steps": [
          "Open Givebutter and choose Engage, then Emails.",
          "Click New email.",
          "Choose a template, such as Plain Text or Monthly Newsletter.",
          "Paste in the message and newsletter link. Add the subject line.",
          "Click Next to choose recipients. Under Tags, choose Library Newsletter.",
          "Check the message and the selected recipients. Choose Send now, then confirm Send. To send another day, choose Schedule."
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
        ],
        "screenshots": [
          {
            "key": "academyGivebutterEmail",
            "view": "givebutter-email",
            "alt": "Givebutter Engage with Emails selected, New email at the upper right, and Sent, Outbox and Drafts below.",
            "beforeStep": 1,
            "framing": "full"
          },
          {
            "key": "academyGivebutterTemplates",
            "view": "givebutter-templates",
            "alt": "Givebutter’s template picker with Plain Text, Monthly Newsletter and other email layouts.",
            "beforeStep": 3,
            "framing": "full"
          }
        ]
      },
      {
        "id": "subscribers",
        "title": "Find newsletter subscribers",
        "text": [
          "Website newsletter signups appear in Givebutter under the Library Newsletter tag."
        ],
        "steps": [
          "Open Givebutter and choose Contacts.",
          "Click Tag above the contact list. Select Library Newsletter, then close the filter menu to see matching contacts.",
          "To find one subscriber, enter their email address in the Search box. Clear the search to see the whole newsletter list again."
        ],
        "screenshots": [
          {
            "key": "academyGivebutterSubscribers",
            "view": "givebutter-subscribers",
            "alt": "Givebutter Contacts with the Tag menu open and Library Newsletter selected. The search contains a fictional address, so no private contact details appear.",
            "beforeStep": 2,
            "caption": "This example search hides contact details. Clear Search to see your subscribers."
          }
        ]
      },
      {
        "id": "cash-check",
        "title": "Record a cash or check donation",
        "text": [
          "Record cash or a check the library has received in Givebutter."
        ],
        "steps": [
          "Open Givebutter. Choose Transactions, then New transaction.",
          "Under Contact, find the donor’s name or create a new contact.",
          "Choose the campaign, meaning the fundraiser the donation belongs to.",
          "Enter the donation date and choose Cash or Check under Payment method. For a check, fill in the check number and deposit date when known.",
          "Enter the donation amount. Review Send a receipt, the public name and amount options, and Send admin notifications.",
          "Check the summary. When the details are right, click Record transaction."
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
        ],
        "screenshots": [
          {
            "key": "academyGivebutterDonation",
            "view": "givebutter-donation",
            "alt": "Givebutter’s blank Record new transaction form. Check is selected, showing Deposit date and Check number; Contact, Campaign and Amount are empty.",
            "beforeStep": 2,
            "framing": "full"
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
    "slug": "facebook-posts",
    "title": "Social posts with Buffer",
    "summary": "Prepare and schedule posts, and connect the library’s social accounts.",
    "parts": [
      {
        "id": "facebook",
        "screenshots": [
          {
            "key": "academyBufferQueue",
            "view": "buffer-queue",
            "caption": "Under Publish, use Drafts for unfinished posts, Queue for scheduled posts and Sent for published posts.",
            "alt": "Buffer’s library Facebook channel with Publish selected in the left menu and Queue, Drafts and Sent tabs across the top.",
            "beforeStep": 3
          }
        ],
        "title": "Make a Facebook post",
        "text": [
          "ChatGPT helps write the post. Buffer is where you review it and choose when it appears on Facebook."
        ],
        "prompt": "Write a Facebook post about this: [page link].",
        "steps": [
          "Read the post ChatGPT writes and ask for any changes.",
          "Ask ChatGPT to put it in Buffer as a draft. If it cannot connect, copy the text and create the post in Buffer yourself.",
          "In Buffer, choose Publish, then Drafts.",
          "Open the post to check the text, photo and Facebook preview."
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
        "id": "buffer-editor",
        "title": "Check the post in Buffer",
        "text": [
          "Open your draft in Buffer. If you are making the post yourself, click New Post and paste in the text from ChatGPT."
        ],
        "steps": [
          "Check that the library’s Facebook picture is selected at the top of the editor.",
          "Read the text and check the Facebook Preview on the right. To add a photo, choose select a file.",
          "Choose Save Draft if you want to finish later, or continue below to choose when to publish."
        ],
        "screenshots": [
          {
            "key": "academyBufferEditor",
            "view": "buffer-editor",
            "alt": "Buffer’s Create Post window with the library Facebook channel selected, a blank message area, photo upload, Facebook Preview and Save Draft controls.",
            "beforeStep": 1
          }
        ]
      },
      {
        "id": "buffer-timing",
        "title": "Choose when the post appears",
        "text": [],
        "steps": [
          "Open the timing menu near the bottom right of the editor. It may say Next Available.",
          "Choose Now to post today, or Set Date and Time to pick a particular time.",
          "Check your choice, then use the button beside the timing menu to publish or schedule the post."
        ],
        "screenshots": [
          {
            "key": "academyBufferTiming",
            "view": "buffer-timing",
            "alt": "Buffer’s posting-time menu open beside the publishing button, showing Next Available, Prioritize, Now, and Set Date and Time.",
            "beforeStep": 1
          }
        ]
      },
      {
        "id": "buffer-connect",
        "title": "Add another social account",
        "text": [
          "Buffer calls each connected social account a channel. Connecting an account requires administrator access in Buffer and permission to manage that social account."
        ],
        "steps": [
          "Open Buffer. Choose Settings, then Channels.",
          "Click Connect Channel.",
          "Choose the social network you want to add, such as Instagram or Facebook.",
          "Sign in to the account you want to connect. For a Facebook Page, sign in with the Facebook profile that manages it, then choose the library’s Page.",
          "Review the account and permissions shown, then finish the connection.",
          "Back in Channels, check that the library’s account name and picture appear in the list."
        ],
        "screenshots": [
          {
            "key": "academyBufferChannels",
            "view": "buffer-channels",
            "framing": "full",
            "beforeStep": 1,
            "alt": "Buffer’s Channels settings in a separate Safari window, with Channels selected on the left and the green Connect Channel button above the library’s Facebook Page."
          },
          {
            "key": "academyBufferConnect",
            "view": "buffer-connect",
            "framing": "full",
            "beforeStep": 3,
            "alt": "Buffer’s Connect a New Channel window showing choices including Instagram, Threads, LinkedIn, Facebook, Bluesky, YouTube and TikTok."
          }
        ],
        "links": [
          {
            "label": "Open Buffer’s channel settings",
            "href": "https://publish.buffer.com/settings/channels"
          },
          {
            "label": "Buffer’s guide to connecting accounts",
            "href": "https://support.buffer.com/articles/connecting-your-channels-to-buffer-HvWLgAJvL9"
          }
        ]
      },
      {
        "id": "buffer-select-account",
        "title": "Choose where a post goes",
        "text": [
          "In Publish, choose an account to see its Queue, Drafts and Sent posts. In the post editor, check the account pictures at the top before saving or scheduling. Select only the accounts that should receive that post."
        ]
      },
      {
        "id": "buffer-reconnect",
        "title": "Reconnect an expired account",
        "text": [
          "If Buffer says a channel needs refreshing, reconnect the existing channel. Refreshing keeps its scheduled posts."
        ],
        "steps": [
          "Open Settings, then Channels.",
          "Find the affected account and choose Refresh.",
          "Sign in with the account that manages the library’s Page or profile and complete the prompts.",
          "Return to Buffer and check the connection. Review any failed posts separately: Re-add to Queue schedules them again; Retry Now publishes immediately."
        ],
        "links": [
          {
            "label": "Buffer’s guide to refreshing a connection",
            "href": "https://support.buffer.com/articles/refreshing-a-channel-in-buffer-7oDS4jk7l1"
          }
        ]
      },
      {
        "id": "buffer-account-help",
        "title": "If the account does not appear",
        "text": [
          "Check which social account you signed in with. For Facebook, that profile needs Full control of the library’s Page.",
          "If Buffer’s connection controls are unavailable, or it asks for an upgrade, tell ChatGPT what you see."
        ],
        "links": [
          {
            "label": "Get technical help",
            "href": "/academy/accounts-and-tools/#sign-in-help"
          }
        ]
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
          "Click your browser’s Reload button, usually a circular arrow near the address. If the page still looks wrong, open the chat where you requested the change. Paste the page link and explain what is missing."
        ],
        "prompt": "This page still shows the old hours: [page link]. They should be [new hours]. Can you check?"
      },
      {
        "id": "broken-link",
        "title": "A button or page is broken",
        "text": [
          "Send ChatGPT the page link and say what you clicked and what happened. Attach a screenshot if you have one."
        ],
        "prompt": "The Donate button on this page does not open: [page link]. Can you check what is wrong?"
      },
      {
        "id": "access",
        "title": "You cannot sign in",
        "text": [
          "Tell ChatGPT which website you are opening and what happens when you try to sign in. Do not share your password in the chat."
        ],
        "links": [
          {
            "label": "Get technical help",
            "href": "/academy/accounts-and-tools/#sign-in-help"
          }
        ]
      }
    ]
  },
  {
    "slug": "practice-with-a-buddy",
    "title": "Examples",
    "summary": "Choose an idea to open a ready-written message in ChatGPT. Read it, then send it.",
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
  },
  {
    "slug": "accounts-and-tools",
    "title": "Accounts and websites",
    "summary": "Links to the websites you may use for library work.",
    "parts": [
      {
        "id": "sign-in-help",
        "title": "Get technical help",
        "text": [
          "The accounts belong to the library. For technical help, use ChatGPT.",
          "For a broken page or a missing update, share the page link and what went wrong. The board answers questions about library facts and approvals."
        ],
        "links": [
          {
            "label": "Get help with a website problem",
            "href": "/academy/when-something-goes-wrong/"
          },
          {
            "label": "Website systems",
            "href": "/academy/website-systems/"
          }
        ]
      },
      {
        "id": "reconnect",
        "title": "Reconnect a plugin",
        "text": [
          "If a ChatGPT plugin shows a Reconnect button, click it and sign in with the library account.",
          "When reconnecting visitor reports, Google may ask you to confirm on the library Google account’s phone. If you get stuck, tell ChatGPT what you see."
        ]
      }
    ]
  },
  {
    "slug": "website-systems",
    "title": "Website systems",
    "summary": "The services that keep the website running.",
    "parts": [
      {
        "id": "how-it-works",
        "title": "From a request to the website",
        "text": [
          "For everyday updates, start in ChatGPT. These services do the work behind it:",
          "Sanity stores the events, hours, news, photos and newsletter files.",
          "GitHub keeps the website files and checks proposed changes. It prepares the preview.",
          "Cloudflare serves the finished website to visitors after the change is approved.",
          "Codex helps change the website’s design and how its features work."
        ]
      },
      {
        "id": "technical-words",
        "title": "Words you might come across",
        "text": [
          "A pull request is a proposed change waiting to be checked and saved. A repository is the collection of website files in GitHub.",
          "Publishing or deployment means putting the finished update on the public website. Publishing content in Sanity and updating the public website are separate steps; the assistant handles the save process.",
          "A domain is the website’s address. Squarespace manages the registration and renewal of cottonwoodcommunitylibrary.com. Cloudflare hosts the current website."
        ]
      },
      {
        "id": "technical-help",
        "title": "Get technical help",
        "text": [
          "Tell ChatGPT what you need help with. Include the page link or the message you see."
        ],
        "links": [
          {
            "label": "Get technical help",
            "href": "/academy/accounts-and-tools/#sign-in-help"
          }
        ]
      }
    ]
  },
  {
    "slug": "automatic-repairs",
    "title": "If automatic repairs are paused",
    "summary": "Turn automatic repairs back on through ChatGPT.",
    "parts": [
      {
        "id": "turn-repairs-back-on",
        "title": "Turn repairs back on",
        "text": [
          "The weekly report may say automatic repairs are paused even while the website still works."
        ],
        "prompt": "turn repairs back on",
        "steps": [
          "Send “turn repairs back on” to ChatGPT.",
          "Open the link it gives you: auth.openai.com/codex/device.",
          "Sign in with the library email and ChatGPT password. Do not choose Continue with Google.",
          "Enter the short code from the assistant and click Continue.",
          "Wait for the assistant to say automatic repairs are back on."
        ]
      },
      {
        "id": "use-your-code",
        "title": "Use only the assistant’s code",
        "text": [
          "Only type codes ChatGPT gives you. If a code expires or something looks wrong, return to the chat and tell the assistant."
        ]
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
    "Ask ChatGPT to write the post. If Buffer is connected, ask it to save a draft there. Open Buffer → Publish → Drafts to review and publish it."
  ],
  [
    "Announce a closure",
    "In ChatGPT: “The library is closed on [date] because [reason]. Add a website notice for that day.”"
  ]
];
