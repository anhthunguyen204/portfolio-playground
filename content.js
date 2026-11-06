// Portfolio content — sourced from anh-thu-nguyen.notion.site/portfolio (fetched Oct 2026).
// Copy is condensed for the web; facts, numbers and roles are kept as written in Notion.
// Block types: p, list, cards, fig, figrow, quote, decision, cols, links, gap
window.PF_CONTENT = {
  person: {
    name: "Thư Nguyễn",
    fullName: "Nguyễn Thị Anh Thư",
    title: "Product Designer (UX/UI)",
    years: "5 years of experience",
    location: "Ho Chi Minh City, Viet Nam",
    statement: "I approach design with a product mindset — focusing not just on visuals, but on solving meaningful problems for both users and the business.",
    aboutHeadline: "I build thoughtful user experiences that align with business and user needs.",
    about: [
      "I'm a UX/UI Designer with 5 years of experience, based in Ho Chi Minh City. I've worked on AI-driven SaaS, B2B, and B2C products across eCommerce, Agritech, and Fintech domains.",
      "My experience covers the full product design lifecycle — from analyzing business logic and understanding user needs, to translating insights into user flows, wireframes, and high-fidelity prototypes.",
      "I am proficient in Figma and have a solid understanding of design principles and best practices. I'm especially passionate about data-driven design and have enjoyed working on AI-driven products, which keeps me up-to-date with new methodologies and research trends to create innovative solutions."
    ],
    motto: "Design is a journey, not a destination. Keep growing, stay updated, and let feedback guide you forward.",
    domains: ["Fintech", "Agritech", "eCommerce", "AI SaaS"],
    // Résumé: replace the PDF at this path (or change the path) to update it everywhere.
    resume: { url: "assets/resume/Thu-Nguyen-Resume.pdf", fileName: "Thu-Nguyen-Resume.pdf" },
    aiWorkflow: {
      intro: "How I use AI across the product design process: to organize information, explore options faster, and prepare better tests. The decisions, and the evidence behind them, stay with me and the team.",
      note: "An illustrative workflow, not the results of a specific project.",
      // AI toolkit chips under the workflow cards — add or remove names here.
      tools: ["Claude Design", "Claude Code", "Figma Make", "ChatGPT"],
      flow: [
        { n: "01", title: "Research & Synthesis", sub: "Organize information · Explore hypotheses" },
        { n: "02", title: "Design & Prototype", sub: "Explore solutions · Create alternatives" },
        { n: "03", title: "Collaborate & Validate", sub: "Prepare UT / A/B · Collect real evidence" },
        { n: "04", title: "Iterate & Improve", sub: "Evaluate findings · Refine the design", last: true }
      ],
      // Short copy shown on the homepage cards (the detailed blocks below are kept for reference).
      cards: [
        { n: "01", lead: "AI-assisted", rest: "Research", body: "Use AI to synthesize research notes, cluster feedback, and surface patterns. Verify every insight against the original evidence.", hl: "surface patterns" },
        { n: "02", lead: "AI-powered", rest: "Exploration", body: "Generate alternative user flows, UI concepts, and copy variations. Use AI-assisted Design-to-Code workflows to turn promising concepts into functional prototypes, while retaining ownership of final design decisions.", hl: "Design-to-Code" },
        { n: "03", lead: "AI-enabled", rest: "Collaboration", body: "Turn product hypotheses into structured test plans, discussion points, and A/B test variations with PMs, BAs, and developers.", hl: "structured test plans" },
        { n: "04", lead: "Human-validated", rest: "Design", body: "Use AI to accelerate iteration, but rely on real user feedback and experiment data to validate design decisions.", hl: "real user feedback" }
      ],
      blocks: [
        { n: "01", title: "AI-assisted research & synthesis",
          body: "I use AI to organize research notes, user feedback and existing product information, surface recurring themes and possible pain points, and draft research questions. It helps me consider alternative readings of a problem before I commit to one.",
          example: ["Collect interview notes, support tickets and product docs", "Ask AI to cluster themes and list open questions", "Review every cluster against the source material", "Write the insight summary that informs the brief"],
          outputs: ["Theme map", "Research questions", "Hypothesis list", "Insight summary"],
          human: "AI organizes; it doesn't replace talking to users or my own judgment." },
        { n: "02", title: "AI-powered design exploration",
          body: "I use AI to explore alternative UX approaches and interaction patterns, speed up wireframing and UI exploration, and try variations of UX copy, while keeping work inside the design system.",
          example: ["Frame the problem and constraints from the brief", "Generate several structural or flow alternatives", "Evaluate them against usability, the system and feasibility", "Refine the chosen direction into a prototype"],
          outputs: ["Flow alternatives", "Wireframes", "Copy variants", "Interactive prototype"],
          human: "I evaluate every output and own the design decisions, usability and visual quality." },
        { n: "03", title: "AI-enabled collaboration & experimentation",
          body: "With Product Managers, Business Analysts and Developers, I use AI to turn design hypotheses into structured usability-testing plans, draft task scenarios and scripts, and prepare UI or copy variants for A/B tests. After sessions, it helps me organize observations into findings the team can review.",
          example: ["Turn a hypothesis into a UT plan with tasks and success criteria", "Prepare prototypes or A/B variants with the team", "Run sessions or the experiment with real users", "Synthesize observations and agree the next iteration together"],
          outputs: ["UT plan & script", "Task scenarios", "A/B variants", "Findings log"],
          human: "AI drafts hypotheses and plans; only real users and experiment data validate a design." }
      ],
      evidence: {
        left: { title: "AI-generated", items: ["Hypotheses", "Possible themes", "Draft plans & variants"] },
        right: { title: "From users & experiments", items: ["Observed behaviour", "Test results", "Validated insights"] }
      }
    },
    email: "ngnanhthu@gmail.com",
    phone: "+84 705 441 776",
    linkedin: "https://www.linkedin.com/in/ngnanhthu204/",
    linkedinLabel: "linkedin.com/in/ngnanhthu204",
    substack: "https://substack.com/@ngnanhthu204",
    // Instax gallery under "Besides being a product designer…" (About page). To add a photo: put the file in
    // assets/images/instax/ and set src to its path (e.g. "assets/images/instax/01.jpg"), then add it to the
    // asset list at the top of Portfolio.dc.html so the Vercel export packs it. src: null shows a placeholder.
    instax: [
      { src: "assets/images/instax/01-station.jpg", alt: "Illustrated portrait of Thư making a peace sign on a train platform", caption: "Little moments" },
      { src: "assets/images/instax/02-stone-wall.jpg", alt: "Illustrated portrait of Thư smiling in front of a stone wall with ivy", caption: "Somewhere in the city" },
      { src: "assets/images/instax/03-desk.jpg", alt: "Thư's desk at night: open book, laptop, headphones, a stack of books, a Monstera and a “stay golden” neon sign", caption: "Creative process" },
      { src: null, alt: "", caption: "Weekend memories" },
      { src: null, alt: "", caption: "A little inspiration" },
      { src: null, alt: "", caption: "Life outside the screen" },
      { src: null, alt: "", caption: "On repeat" },
      { src: null, alt: "", caption: "Collecting moments" }
    ],
    beyond: [
      { title: "Web development", body: "I've been self-teaching HTML, CSS, and website hosting on platforms like GitHub and Vercel / Netlify while working on my own portfolio site. I also designed and built Loluli's e-commerce website for mom and baby products using WordPress, with CMS management and online payment integration.", links: [{ label: "Portfolio site", href: "https://thuxdesign.netlify.app/" }, { label: "loluli.com.vn", href: "https://loluli.com.vn/" }] },
      { title: "Lifelong learning", body: "Curious about the bigger picture, I've been diving into Product Management and Data Analysis through online courses. It's early days, but these learnings are already reshaping how I think about users, problems, and systems.", links: [] },
      { title: "Continuous reading", body: "Reading helps me stay updated with the latest trends, ideas, and knowledge. I regularly follow channels like books and Substack.", links: [{ label: "Substack", href: "https://substack.com/@ngnanhthu204" }] }
    ],
    skills: {
      expertise: ["User Interface Design", "User Research", "Interaction Design", "Prototyping", "Wireframing", "Usability Testing", "User Flow", "Information Architecture", "Sitemap", "Web Design", "Design System", "Desk Research"],
      tools: ["Figma", "FigJam", "Miro", "Notion", "Asana", "Adobe Photoshop", "Adobe Illustrator", "Adobe Premiere", "Adobe Creative Suite", "Claude Design"],
      other: ["Product Requirement Document", "Activity Diagram", "HTML/CSS", "Web Hosting (WordPress, Vercel)"]
    }
  },

  // Playground. Add an object to `experiments` to publish it; the page updates automatically.
  // Fields: title, description, category (one of the category ids), year, status ("Live" | "In progress" | …),
  // thumbnail (image path), thumbnailAlt, projectUrl, sourceUrl, featured (true = shown first). Only title,
  // description and category are required; everything else is optional.
  playground: {
    categories: [
      { id: "vibe-coding", label: "Vibe Coding" },
      { id: "creative-coding", label: "Creative Coding" },
      { id: "motion-interaction", label: "Motion & Interaction" },
      { id: "ai-experiments", label: "AI Experiments" }
    ],
    experiments: [
      // { title: "…", description: "…", category: "creative-coding", year: "2026", status: "Live",
      //   thumbnail: "assets/playground/….png", thumbnailAlt: "…", projectUrl: "https://…", sourceUrl: "https://github.com/…", featured: true }
    ]
  },
  projects: [
    // Lumin projects: entries + animated code-built thumbnails only (thumb: 'lumin-agreement' | 'lumin-experience',
    // see PfProjectPreview.dc.html). PLACEHOLDER copy marked below; replace summary / year / domain / sections
    // when the case studies are written.
    {
      id: "lumin-agreementgen",
      short: "Lumin AgreementGen",
      title: "Designing an AI-Powered Agreement Creation Experience",
      client: "Lumin",
      domain: "AI-Powered Document Workflow",
      year: "2026",
      tags: ["AI-Powered Feature", "Web Application", "Workflow Design", "Document Editor"],
      fullSummary: true,
      summary: "Designed an AI-assisted agreement creation workflow that helps users build well-structured contracts, customize document elements, configure signers and viewers, and prepare agreements for signing.",
      cover: "Lumin AgreementGen",
      thumb: "lumin-agreement",
      placeholder: true,
      role: [], team: [], metrics: [], gaps: [], sections: []
    },
    {
      id: "lumin-experience",
      short: "Lumin Experience",
      title: "Enhancing the Lumin Experience Through Information Architecture",
      client: "Lumin",
      domain: "Product Experience Optimization",
      year: "2026",
      tags: ["UX Research", "Information Architecture", "Usability Testing", "A/B Testing"],
      fullSummary: true,
      summary: "Audited Lumin's existing product experience, redesigned its information architecture, and validated design concepts through internal and external prototype testing with approximately 100 participants. Used research insights to inform subsequent A/B testing on the live product.",
      cover: "Lumin Experience",
      thumb: "lumin-experience",
      placeholder: true,
      role: [], team: [], metrics: [], gaps: [], sections: []
    },
    {
      id: "paykit-onboarding",
      short: "Paykit Onboarding",
      title: "Merchant onboarding & internal workflow automation",
      // card thumbnail: cover.webp is 1200×713 on a solid #A0FFBD field, so it is shown whole (contain) and the
      // frame is filled with the same mint; nothing is cropped in any grid layout.
      coverFit: "contain", coverBg: "#A0FFBD",
      client: "Paykit",
      domain: "Fintech · Payment gateway",
      year: "2025",
      timeline: "Nov 2024 – Feb 2025 (3 months)",
      platform: "Merchant mobile app, internal operations tool",
      role: ["Business analysis", "UX/UI design", "User acceptance testing (UAT)"],
      team: ["Product Owner", "Product Designer", "Operations Executive", "Legal Manager", "Developers"],
      url: "https://paykit.vn/", urlLabel: "paykit.vn",
      tags: ["Fintech", "Internal system", "Payment methods"],
      summary: "Rethinking how merchants register on Paykit and how the Operations team approves their payment methods: a simpler onboarding flow with new legal requirements built in, and an in-app request workflow that replaced email.",
      cover: "Paykit cover — onboarding + Paykit OP mockup",
      metrics: [
        { value: "7 → 2–3 days", label: "Approval time, by minimizing manual reviews" },
        { value: "3–5 min", label: "Registration time for individual and household businesses" },
        { value: "2 flows", label: "Original onboarding split into two business flows" }
      ],
      gaps: [
        "Outcomes don't say how they were measured (period, number of merchants). Add the source if you have it.",
        "Drop-off is described as 'possibly' causing abandonment. Any funnel data from before/after would strengthen the problem."
      ],
      sections: [
        { label: "Context", title: "A payment gateway that runs on three platforms", blocks: [
          { t: "p", text: "Paykit is an online payment gateway that lets merchants accept payments quickly and securely, with free registration. The entire registration happens online in the Paykit app, where merchants integrate payment methods into their platforms and manage transactions and balances." },
          { t: "fig", label: "Ecosystem diagram — merchant app, web portal, internal operation tool", caption: "User interactions across Paykit's three core platforms: the merchant app, the web portal, and the internal operation tool.", ratio: "16/9" }
        ]},
        { label: "Problem", title: "Onboarding was long, non-compliant and manual", blocks: [
          { t: "p", text: "Internal testing and stakeholder feedback surfaced three issues in the existing onboarding process." },
          { t: "cards", items: [
            { title: "Hard to track", body: "The process was long and complex, possibly causing users to abandon it." },
            { title: "Missing legal compliance", body: "New legal requirements were not yet reflected in the onboarding flow." },
            { title: "Heavy manual workload", body: "Important merchant information had to be collected and verified manually by the Operations team." }
          ]}
        ]},
        { label: "Goals", title: "New requirements, four objectives", blocks: [
          { t: "p", text: "Stakeholders added three requirements: sign the service agreement with facial recognition, view and download the agreement during onboarding, and enable VietQR automatically once a merchant account is created. Phase 2 of onboarding set out to:" },
          { t: "list", items: [
            "Simplify the flow by removing unnecessary steps, to lower drop-off and improve completion.",
            "Integrate the legal elements — agreement viewing/downloading and facial-recognition signing.",
            "Minimize manual data collection by automating information gathering.",
            "Auto-enable VietQR after account creation to ease setup for the Operations team."
          ]}
        ]},
        { label: "Process", title: "From requirements to UAT", blocks: [
          { t: "cards", items: [
            { k: "01", title: "Define requirements", body: "Gather and analyze requirements from the Product Owner, Operations team and Legal Manager." },
            { k: "02", title: "UX/UI design", body: "Design for a smooth experience for both merchants and the Operations team." },
            { k: "03", title: "Development", body: "Developers implement the approved designs, including integration with existing systems." },
            { k: "04", title: "Testing", body: "User Acceptance Testing to confirm the feature works as expected and meets requirements." }
          ]},
          { t: "fig", label: "Design process diagram", caption: "", ratio: "21/9" }
        ]},
        { label: "Onboarding", title: "Simplify the flow, meet legal requirements", blocks: [
          { t: "p", text: "Merchant onboarding is how businesses register and set up a merchant account on Paykit. There are three account types, one for each business model." },
          { t: "fig", label: "Three merchant account types", caption: "Three account types corresponding to three business models.", ratio: "16/7" },
          { t: "decision", problem: "Merchants have a lot of information and documents to upload, and may not finish in one session.", decision: "The form no longer forces a strict step-by-step order. Each section can be filled independently, and a checkmark appears once a section is complete, so merchants see what's done and what's missing." },
          { t: "figrow", items: [
            { label: "Non-linear registration form — overview", ratio: "4/5" },
            { label: "Section completed state with checkmarks", ratio: "4/5" }
          ], caption: "The flow starts when the merchant chooses to register, leads into the information form, and ends with signing the service agreement." },
          { t: "decision", problem: "Phase 2 moved more data collection from the Operations team into the app — risking an overwhelming form.", decision: "Reorganized the information architecture of the registration form so the extra fields are grouped and paced." },
          { t: "fig", label: "Registration form — information architecture", caption: "", ratio: "16/9" },
          { t: "decision", problem: "Agreement signing needed stronger security and compliance, and payment setup still depended on Operations.", decision: "Facial recognition is built into agreement signing, and VietQR is enabled automatically on account creation. The merchant receives a confirmation email with a PDF of the signed agreement." },
          { t: "fig", label: "Key screens — facial recognition signing, agreement, success", caption: "", ratio: "16/9" }
        ]},
        { label: "Activation", title: "Payment method requests, out of the inbox", blocks: [
          { t: "p", text: "After onboarding, merchants get VietQR by default and can request more methods like Napas and MPGS (Visa, Mastercard, JCB). Requests used to arrive by email and were approved manually — slow, error-prone, and a source of delays and merchant drop-off." },
          { t: "cols", left: { title: "Paykit App (merchant)", items: ["Submit payment method activation requests", "Collect the legal information Paykit needs", "Track the status of each request"] }, right: { title: "Paykit OP (internal tool)", items: ["Receive merchant requests", "Review and process them", "Trigger automated workflows based on the approval outcome"] } },
          { t: "list", items: [
            "Gathered requirements from the Product Owner, Legal Executive and Operations team, with follow-up meetings for progress and feedback.",
            "Documented requirements for the Tech and Product teams.",
            "Drew a workflow diagram across four entities: merchant, Paykit App, Paykit OP and system.",
            "Aligned with stakeholders on the output before handoff to development."
          ]},
          { t: "fig", label: "Workflow — receiving and evaluating activation requests", caption: "How the Operations team receives and evaluates payment method activation requests.", ratio: "16/9" },
          { t: "figrow", items: [
            { label: "PRD — request statuses", ratio: "4/3" },
            { label: "PRD — notifications", ratio: "4/3" },
            { label: "PRD — activity history", ratio: "4/3" }
          ], caption: "Excerpts from the product requirement document." },
          { t: "p", text: "In the merchant app, the request form reuses the onboarding form's input structure for consistency, with sections for online sales channels, physical stores and sample invoices." },
          { t: "figrow", items: [
            { label: "App — request form", ratio: "9/16" },
            { label: "App — online sales channel", ratio: "9/16" },
            { label: "App — physical store", ratio: "9/16" },
            { label: "App — sample invoice", ratio: "9/16" }
          ], caption: "" },
          { t: "fig", label: "Paykit OP — activation request list", caption: "Request list in the internal platform.", ratio: "16/10" },
          { t: "fig", label: "Paykit OP — activation request detail", caption: "Request detail page, where Operations reviews and approves.", ratio: "16/10" }
        ]},
        { label: "Outcome", title: "Faster approvals, less manual work", blocks: [
          { t: "list", items: [
            "Reduced approval time from 7 days to 2–3 days by minimizing manual reviews.",
            "Shortened registration for individual and household businesses to 3–5 minutes.",
            "Integrated legal compliance (agreement signing via facial recognition) into onboarding, reducing manual data collection.",
            "Split the original onboarding flow into two separate business flows, reducing Operations workload per case.",
            "Enabled in-app payment method requests, cutting manual work for Operations."
          ]},
          { t: "fig", label: "paykit-mockup.png — final mockup", caption: "", ratio: "16/9" }
        ]}
      ]
    },

    {
      id: "enfarm",
      short: "Enfarm",
      title: "Enfarm — an AI-powered agritech app with IoT integration for Vietnamese farmers",
      client: "Enfarm",
      domain: "Agritech · AI + IoT",
      year: "2024",
      timeline: "Jun – Oct 2023",
      platform: "Mobile app, responsive website",
      role: ["UX/UI design"],
      team: ["1 Tech Lead / PO", "2 Back-end developers", "1 Front-end developer", "1 UX/UI designer"],
      url: "https://enfarm.com/", urlLabel: "enfarm.com",
      tags: ["Agritech", "MVP", "Field testing"],
      summary: "Designing the MVP of an app that turns soil-sensor data into fertilizer recommendations — for farmers with low tech familiarity, who use their phones outdoors.",
      cover: "enfarm-thumbnail.png",
      metrics: [],
      gaps: [
        "Timeline reads 'June – Oct 2023 (6 months)', which is about 5 months, and the project is tagged 2024. Confirm dates.",
        "Field testing is described but not quantified — number of rounds, farmers, or the issues found would help.",
        "The team lists one UX/UI designer; confirm you were the sole designer so the page can say so."
      ],
      sections: [
        { label: "Context", title: "Sensors in the soil, advice on the phone", blocks: [
          { t: "p", text: "Enfarm uses AI and IoT to help farmers manage crops. Specialized hardware gathers real-time soil data; the app displays it and gives personalized advice, including the optimal type and amount of fertilizer. The aim is lower costs, higher yields, healthier soil and a more sustainable ecosystem." },
          { t: "fig", label: "Enfarm in the field — press photo", caption: "Source: VnExpress", ratio: "16/9" },
          { t: "links", items: [
            { label: "Tuoi Tre News — Vietnamese AI startup honored at AI Summit in Paris", href: "https://tuoitrenews.vn/news/business/20250215/vietnamese-ai-startup-honored-at-ai-summit-in-paris/84556.html" },
            { label: "Báo Đầu Tư — Enfarm: AI for Vietnamese agriculture", href: "https://baodautu.vn/enfarm---cong-nghe-ai-cho-nong-nghiep-viet-nam-vuon-ra-the-gioi-d245208.html" },
            { label: "CafeF — feature on Enfarm", href: "https://cafef.vn/startup-giup-cuc-dat-cai-cay-cung-biet-noi-nang-va-cuu-duoc-50-san-luong-sau-rieng-thang-thung-tu-choi-2-shark-vi-bi-dinh-gia-thap-188240814073629285.chn" }
          ]}
        ]},
        { label: "Goals", title: "Launch an MVP to learn from real farmers", blocks: [
          { t: "list", items: [
            "Ensure seamless integration between hardware devices and software.",
            "Design an experience suited to farmers and their frequent outdoor work.",
            "Keep interaction and feedback consistent between devices and the app, for a cohesive data-collection experience."
          ]},
          { t: "cards", items: [
            { k: "Phase 1", title: "Launch MVP", body: "Weather forecast, farmer's handbook, pest and disease diagnosis, market prices." },
            { k: "Phase 2", title: "Improve UI, build website", body: "Surface key features on the home screen; build a site that introduces Enfarm and supports users." },
            { k: "Phase 3", title: "Optimize experience", body: "Simplify navigation; add member management and device management." }
          ]}
        ]},
        { label: "Discover", title: "Stakeholders, then the competition", blocks: [
          { t: "p", text: "Meetings with the CEO, Product Owner, Business Development and developers aligned business goals with features and surfaced technical constraints for a short timeframe. Desk research reviewed agricultural apps Agrio and MobiAgri — public UI screens, layout patterns, icon use, data visualization, content and tone — to see how they communicate data to low-tech users." },
          { t: "figrow", items: [
            { label: "Desk research — Agrio", ratio: "16/10" },
            { label: "Desk research — MobiAgri", ratio: "16/10" }
          ], caption: "" },
          { t: "list", items: [
            "A cleaner, more focused home screen with only key actions visible.",
            "Larger, high-contrast elements for outdoor use.",
            "Consistent icons and intuitive groupings — tools, data, news.",
            "Bite-sized cards to reduce cognitive load."
          ]}
        ]},
        { label: "Define", title: "A farmer in the Central Highlands", blocks: [
          { t: "cols", left: { title: "Persona", items: ["Age 30–50+", "Rural areas, mainly the Central Highlands (Đắk Lắk and surrounding provinces)", "Farmers, farm owners, agricultural workers", "Low tech familiarity — smartphone mostly for calls, Zalo, Facebook"] }, right: { title: "Goals", items: ["Improve yield without increasing fertilizer costs", "Timely weather updates and region-specific advice", "Depend less on local agricultural agents"] } },
          { t: "cols", left: { title: "Pain points", items: ["Unsure when, how much and what fertilizer to use", "No clear, localized insight on weather, soil nutrients, crop health", "Limited access to agricultural expertise"] }, right: { title: "Needs", items: ["A simple mobile solution with clear recommendations for local conditions", "Personalized guidance to optimize inputs and reduce costs"] } },
          { t: "cards", items: [
            { title: "Low-tech user base", body: "Many farmers aren't tech-savvy, so the interface must be intuitive and direct." },
            { title: "Outdoor use", body: "Varying light conditions and accessibility in the field." },
            { title: "Hardware–software cohesion", body: "A seamless experience between physical devices and the app." }
          ]}
        ]},
        { label: "Ideate", title: "One answer per challenge", blocks: [
          { t: "decision", problem: "Low-tech user base", decision: "A simplified, icon-driven interface with clear language and hierarchy, plus guided steps to get started." },
          { t: "decision", problem: "Outdoor conditions", decision: "High-contrast elements and large touch targets for sunlight; offline-friendly interactions where possible; less information per screen." },
          { t: "decision", problem: "Hardware–software cohesion", decision: "Clear status feedback ('Device connected', 'Data synced successfully'), shared terminology across device and app, and close testing with engineers on real-time communication." },
          { t: "cards", items: [
            { k: "Setup", title: "Add sensors", body: "Connect IoT devices via Bluetooth to start collecting data." },
            { k: "Setup", title: "Add farm", body: "Create farm profiles with location and basic details." },
            { k: "Setup", title: "Enter crop info", body: "Crop data that personalizes recommendations." },
            { k: "Return", title: "Sensor reports", body: "Real-time and historical soil and environment data." },
            { k: "Return", title: "Recommendations", body: "Tailored tips based on sensor data and weather." }
          ]}
        ]},
        { label: "Design", title: "Mobile app and website", blocks: [
          { t: "fig", label: "mobile-app-mockup.jpg", caption: "", ratio: "16/9" },
          { t: "fig", label: "App screens overview", caption: "", ratio: "16/9" },
          { t: "p", text: "The website introduces the brand to potential customers: Home, About Us, Product Info for the IoT devices, and News & Knowledge." },
          { t: "fig", label: "Enfarm website", caption: "", ratio: "16/9" }
        ]},
        { label: "Test", title: "In the field, then back to the screens", blocks: [
          { t: "p", text: "Several rounds of usability testing, led by the Business Development team, put early versions of the app and hardware in front of real farmers in the field. The feedback shaped three key improvements." },
          { t: "figrow", items: [
            { label: "Field testing photo (source: enfarm.com)", ratio: "4/3" },
            { label: "Field testing photo", ratio: "4/3" }
          ], caption: "" },
          { t: "decision", problem: "Important, frequently used features weren't on the home screen.", decision: "Redesigned the home screen around those features." },
          { t: "fig", label: "Home screen — before / after", caption: "", ratio: "16/9" },
          { t: "decision", problem: "Version 1 of Add Farm was complex; users didn't understand the on-screen buttons.", decision: "Version 2 is a step-by-step flow that asks only for farm name, location and crop type, instead of drawing farm boundaries on a map." },
          { t: "figrow", items: [
            { label: "Add Farm — version 1", ratio: "4/5" },
            { label: "Add Farm — version 2 (Nhap_trang_trai.png)", ratio: "4/5" }
          ], caption: "" },
          { t: "decision", problem: "Using the app and hardware outdoors was difficult.", decision: "Larger, high-contrast elements throughout." },
          { t: "fig", label: "High-contrast UI for outdoor use", caption: "", ratio: "16/9" }
        ]}
      ]
    },

    {
      id: "paykit-payout",
      short: "Payout Accounts",
      title: "Payout account management",
      client: "Paykit",
      domain: "Fintech · Bank accounts",
      year: "2024",
      timeline: "Nov 2024 – Feb 2025 (3 months)",
      platform: "Merchant mobile app, internal operations tool",
      role: ["Business analysis", "UX/UI design", "Functional specification (FSD)", "User acceptance testing (UAT)"],
      team: ["Product Owner", "Product Designer", "Operations Executive", "Legal Manager", "Developers"],
      url: "https://paykit.vn/", urlLabel: "paykit.vn",
      tags: ["Fintech", "FSD", "UAT"],
      summary: "Letting merchants add and manage the bank accounts they withdraw their balance to, and giving the Operations team an approval flow in the internal tool — with the edge cases written down before development started.",
      cover: "Payout account management — app + Paykit OP",
      metrics: [],
      gaps: [
        "Timeline is identical to the Merchant Onboarding project while this one is tagged 2024. Confirm dates.",
        "The Notion 'Expectation' section describes the payment-method request flow (copied from onboarding?). I left it out.",
        "No outcomes recorded. Even qualitative ones (fewer dev questions, UAT defects found) would help."
      ],
      sections: [
        { label: "Context", title: "Merchants need somewhere to withdraw to", blocks: [
          { t: "p", text: "Merchants accumulate a balance as their customers pay through Paykit, and need a bank account to withdraw it. Payout account management sits alongside balance management, top-up and payout: merchants add bank accounts, and Paykit's accounting team pays out to them." },
          { t: "p", text: "Added accounts aren't active immediately — Operations must review and approve them first. So the feature also needed an approval flow in Paykit OP, the internal tool." },
          { t: "list", items: [
            "Business impact: shorten bank account collection during onboarding.",
            "Business impact: self-managed payout accounts open the way to an automated payout flow, reducing Operations workload."
          ]}
        ]},
        { label: "Roadmap", title: "Two phases", blocks: [
          { t: "cards", items: [
            { k: "Phase 1", title: "Payout account management", body: "Add, edit and delete payout accounts." },
            { k: "Phase 2", title: "Payout request flow", body: "Add and edit payout accounts while making a payout request." }
          ]}
        ]},
        { label: "Logic", title: "Rules before screens", blocks: [
          { t: "p", text: "Requirements came from meetings with the Product Owner and Operations, documented for Tech and Product, with a workflow diagram across merchant, Paykit App, Paykit OP and system. The functional specification fixed the rules developers would implement:" },
          { t: "cards", items: [
            { title: "Adding", body: "Up to 5 payout accounts per merchant. The first account added becomes the default." },
            { title: "Deleting", body: "With one account, the default can be deleted. With more than one, the default can't be deleted; regular accounts can." },
            { title: "Locking", body: "If Operations locks the default account, it doesn't switch automatically — the merchant sets a new default." }
          ]},
          { t: "figrow", items: [
            { label: "Flowchart — add payout account", ratio: "3/4" },
            { label: "Flowchart — change default", ratio: "3/4" },
            { label: "Flowchart — delete", ratio: "3/4" }
          ], caption: "" },
          { t: "figrow", items: [
            { label: "Flowchart — approve / deny", ratio: "3/4" },
            { label: "Flowchart — lock", ratio: "3/4" }
          ], caption: "" }
        ]},
        { label: "Merchant app", title: "Add, set default, delete", blocks: [
          { t: "p", text: "The add flow defines its error handling — account number doesn't exist, invalid number, error retrieving account information, duplicate account — along with bank search, input and deletion behaviour for the account number field, and user permissions." },
          { t: "fig", label: "Add payout account — flow and error states", caption: "", ratio: "16/9" },
          { t: "p", text: "The default payout account is the one that receives payouts when the payment cycle arrives." },
          { t: "fig", label: "Change default payout account", caption: "", ratio: "16/9" },
          { t: "fig", label: "Delete payout account — rules by account count", caption: "", ratio: "16/9" }
        ]},
        { label: "Internal tool", title: "Approval in Paykit OP", blocks: [
          { t: "p", text: "Built on the existing design system's foundational components, with new components where needed. The list page's columns come from analysing the approval process with the Ops team; the status column reflects actions in both the merchant app and Paykit OP. Ops users can also add payout accounts manually." },
          { t: "fig", label: "Paykit OP — payout account list", caption: "", ratio: "16/10" },
          { t: "p", text: "The detail page shows different actions and activity history depending on the account's status." },
          { t: "figrow", items: [
            { label: "Detail — pending", ratio: "16/10" },
            { label: "Detail — approved", ratio: "16/10" }
          ], caption: "" }
        ]},
        { label: "Delivery", title: "Development and UAT", blocks: [
          { t: "p", text: "During development I answered the Tech team's questions and followed up so the design logic was understood and implemented correctly." },
          { t: "list", items: [
            "Wrote test cases for functionality and user experience.",
            "Ran two rounds of testing to find and resolve issues.",
            "Reviewed and addressed defects with QA.",
            "Verified fixes after release."
          ]},
          { t: "fig", label: "UAT test cases", caption: "", ratio: "16/9" }
        ]},
        { label: "Learnings", title: "Takeaways", blocks: [
          { t: "cards", items: [
            { title: "Balancing UX with operations", body: "Merchant usability and flexibility had to coexist with manual approval and compliance checks." },
            { title: "Clear logic, fewer iterations", body: "Defined error handling, permissions and workflow logic reduced back-and-forth with developers." },
            { title: "Designing for what's next", body: "The work laid the groundwork for automated payout flows." }
          ]}
        ]}
      ]
    },

    {
      id: "sssmarket",
      short: "SSSMarket",
      title: "SSSMarket — product growth: features, conversion and a brand refresh",
      client: "SSSMarket",
      domain: "eCommerce · Secondhand fashion",
      year: "2022",
      timeline: "May – Aug 2022 (3 months)",
      platform: "Mobile app",
      role: ["Research", "UX/UI design", "Core visual elements for the new branding", "Design system file and basic guidelines", "Iteration from feedback"],
      team: ["Nguyen Thi Anh Thu — UX/UI Designer", "Pham Quynh Anh — Product Manager", "Tran Le Minh Dang — UX/UI Designer"],
      url: "https://kenh14.vn/sssmarket-tu-tu-do-cua-gen-z-den-the-gioi-thoi-trang-ben-vung-20220720230452254.chn", urlLabel: "Press — Kenh14",
      tags: ["eCommerce", "Design system", "Conversion"],
      summary: "After passing 1 million downloads, a secondhand shopping app that blends shopping with content entered a growth phase: a rebuilt design system and visual identity, a virtual fitting room, and discovery changes aimed at a low conversion rate.",
      cover: "SSSMarket.png",
      metrics: [{ value: "1M+", label: "Downloads before the growth phase" }, { value: "20%", label: "Weekly team capacity dedicated to the design system" }],
      gaps: [
        "The conversion work reads as a plan — no shipped results or metrics after launch.",
        "Fitting-room 'pros' come from early internal testing with a small group. Note how many people if known."
      ],
      sections: [
        { label: "Context", title: "Three objectives for a growth phase", blocks: [
          { t: "p", text: "Launched in late 2020, SSSMarket combines secondhand shopping with content-consuming behaviors. User feedback and data revealed new challenges after 1 million downloads; this phase addressed them." },
          { t: "cards", items: [
            { k: "I", title: "Visual identity & design system", body: "Refresh the visual language and build a scalable system." },
            { k: "II", title: "Virtual fitting room", body: "A personalized try-on experience to reduce uncertainty." },
            { k: "III", title: "Discovery & conversion", body: "Optimize discovery and shopping to improve conversion rate." }
          ]}
        ]},
        { label: "System", title: "Rebuilding the design system", blocks: [
          { t: "decision", problem: "Tight deadlines meant designing flow by flow instead of refining the UI kit. The kit grew cluttered and hard to navigate, causing inconsistencies and errors.", decision: "I took the initiative to restructure it into a clear system for designers and developers — auditing Material Design, Spectrum and Atlassian and applying atomic design principles." },
          { t: "p", text: "The team dedicated 20% of weekly capacity to system work. I led it: organizing files, naming components, defining visuals and writing basic guidelines." },
          { t: "cards", items: [
            { k: "01", title: "Research", body: "Study leading design systems for structure and best practice." },
            { k: "02", title: "Organize", body: "Clean up and structure Figma files and libraries." },
            { k: "03", title: "Define", body: "Build core components with atomic design." },
            { k: "04", title: "Implement", body: "Apply, rename and standardize components by feature." }
          ]}
        ]},
        { label: "Redesign", title: "Screen by screen, after the brand refresh", blocks: [
          { t: "p", text: "Ideation (heuristic evaluation, lo-fi wireframes, stakeholder alignment), hi-fi design, clickable prototypes with animation for key flows, then reviews and refinement." },
          { t: "screen", title: "Home", items: ["Better product discovery from the first screen", "Clearer content hierarchy, icons and spacing", "Active promotions and the KOL spotlight prioritized"] },
          { t: "screen", title: "Discovery", items: ["Like, buy now, add to cart and visual search more accessible", "CTAs reorganized for reach and faster interaction", "Short description, size, color and shop visible while browsing"] },
          { t: "screen", title: "Product details", items: ["Color and size selection", "Visual search for similar items", "A 'Safe Shopping' section with return, refund and exchange policies"] },
          { t: "screen", title: "Voucher", items: ["Visual style aligned with the new identity", "Free shipping vouchers in their own tab"] },
          { t: "screen", title: "Cart", items: ["Quantity selector in the cart", "Size and color shown before checkout"] },
          { t: "screen", title: "Profile", items: ["Posts and purchases in separate tabs", "Payment, addresses, daily rewards, vouchers and fitting room grouped together"] },
          { t: "fig", label: "sss-mockup.png", caption: "", ratio: "16/9" }
        ]},
        { label: "Fitting room", title: "Try it on a body like yours", blocks: [
          { t: "p", text: "Users pick a model with a body type similar to theirs and preview how clothes might look — a more personal way to reduce uncertainty when shopping online." },
          { t: "figrow", items: [
            { label: "First-time experience", ratio: "9/16" },
            { label: "Try-on & add to cart", ratio: "9/16" },
            { label: "Background & save", ratio: "9/16" }
          ], caption: "Pick a model and set it as default; choose size and color and add to cart; pick a background, save the look or share it." },
          { t: "cols", left: { title: "Pros (early internal testing)", items: ["Positive reactions — many found it fun and were curious to try it", "Some users spent more time switching models and exploring", "Seeing clothes on models helped users visualize them"] }, right: { title: "Cons", items: ["Works well only with clean, transparent-background product images", "Complex angles and layers are hard to render", "Shops without the right image formats can't use it, so the experience is inconsistent"] } }
        ]},
        { label: "Conversion", title: "Browsing was healthy; buying wasn't", blocks: [
          { t: "p", text: "Daily active users and browsing were decent, but the intent conversion rate stayed lower than expected — critical for short-term revenue and long-term retention." },
          { t: "p", text: "The team studied 'Shop till I Depop', an analysis of the buying flow in Depop, a peer-to-peer resale app. Its pain points: no structured comparison, slow decisions that broke browsing, hard-to-revisit saved items, weak sorting, and confusing visual cues like alarming red notifications. Brainstorming then mapped SSSMarket's journey from discovery to purchase to find where users lost interest or hesitated." },
          { t: "fig", label: "User journey mapping on Miro", caption: "Mapping user behaviors and conversion opportunities during team brainstorming.", ratio: "16/9" },
          { t: "decision", problem: "Lack of trust", decision: "Moved 'KOL's Closet' to the top of Home, and showed trust badges, shop ratings and sales counts on product cards." },
          { t: "decision", problem: "Lack of urgency", decision: "Cart reminders at 5+ items, and applicable vouchers highlighted in the cart." },
          { t: "decision", problem: "Hard to identify the best option", decision: "Similar items from other shops, in a similar price range, without leaving the screen." },
          { t: "decision", problem: "Irrelevant discovery", decision: "Visual search: upload or snap a photo to find similar products." },
          { t: "list", items: [
            "Proposed segmentation — empty cart or no purchases: best-sellers on Discovery.",
            "More than 10 items in cart: reminders to review or clean up.",
            "One purchase: similar or complementary products.",
            "More than 3 purchases: loyalty incentives or early access to deals."
          ]}
        ]}
      ]
    },

    {
      id: "doctranslate",
      short: "Doctranslate",
      title: "Doctranslate.io — MVP of an AI document translation tool",
      client: "Doctranslate.io",
      domain: "SaaS · LLM",
      year: "2023",
      timeline: "Mar – Jul 2023 (4 months)",
      platform: "Responsive web",
      role: ["Website branding", "UI design from scratch", "User flows & wireframes", "Front-end collaboration", "Iteration from feedback"],
      team: [],
      url: "https://doctranslate.io/", urlLabel: "doctranslate.io",
      tags: ["SaaS", "LLM", "MVP"],
      summary: "Branding and interface, designed from scratch, for the MVP of a tool that translates Word, Excel, PDF and PowerPoint files with AI — tuned to the document's purpose.",
      cover: "Doctranslate-thumbnail.png",
      metrics: [],
      gaps: [
        "No outcomes. The stated business goal was converting visitors into registered users — any signal here would help.",
        "Flows and wireframes are listed in your contribution but not shown.",
        "Team composition isn't documented."
      ],
      sections: [
        { label: "Context", title: "An hour per page is too long", blocks: [
          { t: "p", text: "Doctranslate detects a document's language and translates it, with bilingual output and AI that adapts to the document's purpose — administration, email, books. The MVP covered customizable translation, summarization, a personal dictionary and downloads." },
          { t: "p", text: "Translating a single page of simple content can take up to an hour; complex documents take longer. Doctranslate set out to cut that time and cost while keeping documents secure and results high quality." },
          { t: "cols", left: { title: "User goal", items: ["Translate many documents accurately and efficiently, in the right language style for each type"] }, right: { title: "Business goal", items: ["A seamless process with fewer errors", "Increase conversion of visitors into registered users"] } }
        ]},
        { label: "Principles", title: "Three principles for an MVP", blocks: [
          { t: "cards", items: [
            { title: "Scalability", body: "Room for new features and use cases after the MVP." },
            { title: "Simplicity", body: "A straightforward UI focused on ease of use and translation quality." },
            { title: "Usability", body: "Intuitive interfaces, clear instructions, minimal cognitive load." }
          ]}
        ]},
        { label: "Screens", title: "Key screens", blocks: [
          { t: "decision", problem: "Visitors need to understand immediately that this is a document translation tool.", decision: "The home page puts the translation form above the fold and lets people translate without logging in, combining the introduction with the main feature." },
          { t: "fig", label: "Home page", caption: "", ratio: "16/10" },
          { t: "p", text: "The translation form offers two inputs: upload a document from the device, or type text directly." },
          { t: "fig", label: "mockup-translation form.png", caption: "", ratio: "16/10" },
          { t: "decision", problem: "Two kinds of users — immediate one-off needs and longer, less frequent use — and uncertainty about payment and credibility.", decision: "Two payment models: a Standard top-up package and a monthly subscription. A prominent banner offers instant chat with Doctranslate for help." },
          { t: "fig", label: "mockup-credit-charge.png", caption: "Credit recharge page.", ratio: "16/10" },
          { t: "p", text: "My Dictionary lets users with specific vocabulary needs build personal word lists for their translations." },
          { t: "fig", label: "mockup-dictionary.png", caption: "", ratio: "16/10" }
        ]}
      ]
    },

    {
      id: "bim",
      short: "BIM",
      title: "BIM — a pregnancy tracking app for maternal health care",
      client: "Academic project",
      domain: "Healthcare · Academic",
      year: "2023",
      timeline: "Jul – Sep 2023",
      platform: "Mobile app, landing website",
      role: ["Lead UX/UI design", "Market research", "Competitor analysis", "User survey", "UI kit", "Lo-fi & hi-fi wireframes", "Clickable prototype", "Website design & launch"],
      team: ["5 members"],
      url: "https://bimapp.vercel.app/", urlLabel: "bimapp.vercel.app",
      tags: ["Healthcare", "Research", "Prototyping"],
      summary: "An academic project from my design training: a pregnancy tracking app for Vietnamese moms — from trying to conceive through after birth — with fetal growth tracking, check-up reminders and a trusted knowledge hub.",
      cover: "Bim-thumbnail.png",
      metrics: [],
      gaps: [
        "Timeline is listed as 2 months for Jul – Sep. Confirm.",
        "No usability testing of the prototype is documented."
      ],
      sections: [
        { label: "Context", title: "Built in training, run like a real project", blocks: [
          { t: "quote", text: "This was an academic project completed during my design training to practice the full UX/UI design process in a real-world context." },
          { t: "p", text: "BIM helps Vietnamese moms follow their pregnancy with daily tips and science-based information, at every stage: trying to get pregnant, pregnancy, and after birth." }
        ]},
        { label: "Discover", title: "Statistics, competitors, and eight moms", blocks: [
          { t: "cards", items: [
            { title: "Average age at childbirth", body: "Fertility rates in Vietnam peak between 20 and 29, at 130 live births per 1,000 women." },
            { title: "Weeks 18–25", body: "Key stages in fetal sensory development, when prenatal education can stimulate the senses." },
            { title: "Prenatal care", body: "Without proper care, the risk of preterm birth and low birth weight doubles." }
          ]},
          { t: "fig", label: "bim-competitor-analysis.png", caption: "Competitor analysis to find market gaps and ways to differentiate.", ratio: "16/9" },
          { t: "cols", left: { title: "Survey", items: ["Online, via Google Forms, over 7 days", "8 women aged 25–35", "Mostly first-time moms in Ho Chi Minh City"] }, right: { title: "Explored", items: ["Stage of pregnancy and symptoms", "Diet and nutrition habits", "Willingness to pay for a tracking app, and how much"] } },
          { t: "p", text: "The sample was small, but the answers guided early design decisions." },
          { t: "figrow", items: [{ label: "Survey — symptoms experienced", ratio: "4/3" }, { label: "Survey — willingness to pay", ratio: "4/3" }], caption: "" }
        ]},
        { label: "Define", title: "Three problems to solve", blocks: [
          { t: "figrow", items: [{ label: "bim-persona-1.png", ratio: "4/3" }, { label: "bim-persona-2.png", ratio: "4/3" }], caption: "" },
          { t: "cards", items: [
            { k: "01", title: "Prenatal education", body: "First-time moms lack accessible, trustworthy guidance, leading to confusion and anxiety." },
            { k: "02", title: "Scattered health data", body: "No easy central place to log and monitor health data or share it with doctors." },
            { k: "03", title: "Missed check-ups", body: "Busy users struggle to keep up with antenatal appointments without reminders." }
          ]}
        ]},
        { label: "Design", title: "From lo-fi to a UI kit to prototype", blocks: [
          { t: "fig", label: "lo-fi-bim.png", caption: "Low-fidelity wireframes.", ratio: "16/9" },
          { t: "figrow", items: [{ label: "typography.png", ratio: "4/3" }, { label: "color-system.png", ratio: "4/3" }], caption: "UI kit — typography and color system." },
          { t: "p", text: "Onboarding asks for the mom's goals, baby details and daily habits to personalize the experience. Daily Record logs mood, symptoms and water intake and charts them over the pregnancy. Pregnancy Details shows the current week, the baby's growth, common symptoms and tips." },
          { t: "fig", label: "home-screen-notation.png", caption: "Annotated home screen.", ratio: "16/9" },
          { t: "fig", label: "Hi-fi screens — daily record, pregnancy details, nutrition, knowledge hub", caption: "", ratio: "16/9" }
        ]},
        { label: "Website", title: "A landing page to drive downloads", blocks: [
          { t: "p", text: "I designed and launched the BIM website to introduce the app and guide users to download it: overview, highlighted features, interface preview, Premium plans, testimonials, download links and contact." },
          { t: "fig", label: "responsive-website-mockup.png", caption: "", ratio: "16/9" }
        ]}
      ]
    }
  ],

  audit: {
    excluded: [{ title: "Furniture shopping website", note: "Listed in Featured Work with no content, category or date. Excluded until there's a case study." }],
    global: [
      "Résumé: the Notion button's file couldn't be read. Provide the PDF or link.",
      "Images: all screenshots live in Notion with expiring links. Export them (or drop them into the image slots on each page).",
      "Experience: '4 years' is stated, but employers, titles and dates aren't listed anywhere. Needed for an Experience timeline.",
      "Positioning mentions AI-driven SaaS; only Doctranslate (LLM) and Enfarm (AI recommendations) evidence it."
    ]
  }
};
