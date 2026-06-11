/**
 * Detailed knowledge base for the AI chat assistant.
 * Keyed by a normalized service title (see normalizeKey) so it can be matched
 * against the live services stored in the database. The DB is the source of
 * truth for WHICH services are offered; this file enriches each with the
 * taglines, benefits, and deliverables the assistant uses to answer questions.
 */

export interface ServiceKnowledge {
  tagline: string;
  summary: string;
  benefits: string[];
  deliverables: string[];
  idealFor: string;
}

export function normalizeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

export const servicesKnowledge: Record<string, ServiceKnowledge> = {
  "social-media-management": {
    tagline: "Grow a brand people love to follow",
    summary:
      "End-to-end social presence management — strategy, content, scheduling, and community — keeping the brand consistent, on-trend, and growing across every platform.",
    benefits: [
      "Consistent, data-driven follower and reach growth",
      "Higher engagement (comments, shares, saves) not just likes",
      "Saves the client hours every week",
      "Clear monthly reporting tied to business outcomes",
    ],
    deliverables: [
      "Multi-platform strategy (Instagram, Facebook, X, LinkedIn, TikTok)",
      "Branded content and graphics creation",
      "Content calendar and scheduling",
      "Community management and DMs",
      "Hashtag and trend research",
      "Monthly performance reports",
    ],
    idealFor: "Brands that want a consistent, professionally managed social presence.",
  },
  "whatsapp-chatbot": {
    tagline: "Answer every customer, 24/7",
    summary:
      "AI-powered WhatsApp chatbots that qualify leads, answer FAQs, track orders, and book appointments around the clock so no customer waits.",
    benefits: [
      "Instant responses any time, any time zone",
      "More qualified leads captured automatically",
      "Lower support costs via automation",
      "Smooth handoff to a human for complex queries",
    ],
    deliverables: [
      "Natural-language AI conversations",
      "Lead qualification and capture",
      "Order tracking and FAQs",
      "Appointment booking flows",
      "CRM and spreadsheet integrations",
      "Human handoff when required",
    ],
    idealFor: "Businesses with high inbound message volume or after-hours inquiries.",
  },
  "whatsapp-messaging-campaigns": {
    tagline: "Reach thousands with one tap",
    summary:
      "Personalized WhatsApp broadcast campaigns to opted-in audiences with rich media, smart segmentation, and real-time delivery analytics.",
    benefits: [
      "Up to ~98% open rates — far above email",
      "Personalized at scale with dynamic fields",
      "Rich media: images, video, catalogs, buttons",
      "Real-time delivery, read, and click analytics",
    ],
    deliverables: [
      "Opt-in list management",
      "Audience segmentation",
      "Personalized broadcast messages",
      "Rich media and interactive buttons",
      "Delivery and read analytics",
      "Compliance and consent handling",
    ],
    idealFor: "Brands with a permission-based audience who want high-visibility messaging.",
  },
  "zoom-meetings-manager": {
    tagline: "Never miss a client call again",
    summary:
      "End-to-end Zoom scheduling and automation — booking links, reminders, and follow-ups — so meetings run themselves and clients show up.",
    benefits: [
      "Fewer no-shows with automated reminders",
      "Effortless self-service booking",
      "Automated post-meeting follow-ups",
      "Organized, tracked meeting pipeline",
    ],
    deliverables: [
      "Automated booking links",
      "Calendar sync and availability",
      "Email and WhatsApp reminders",
      "Post-meeting follow-ups",
      "Recurring meeting management",
      "Attendance tracking",
    ],
    idealFor: "Consultants, coaches, and sales teams that run lots of client calls.",
  },
  "software-consultancy": {
    tagline: "Expert guidance for your tech stack",
    summary:
      "Aligning software with business goals — architecture reviews, technology selection, and digital transformation roadmaps so clients build the right thing the right way.",
    benefits: [
      "Avoid costly technology mistakes",
      "Faster delivery via streamlined architecture",
      "Scalable foundations that grow with the business",
      "Vendor-neutral, honest advice",
    ],
    deliverables: [
      "Architecture and code reviews",
      "Technology selection",
      "Digital transformation roadmaps",
      "Performance and security audits",
      "Team and process optimization",
      "Ongoing advisory support",
    ],
    idealFor: "Teams making big technology decisions or modernizing legacy systems.",
  },
  "crypto-web3-projects": {
    tagline: "Build the decentralized future",
    summary:
      "Token launches, NFT marketplaces, DeFi platforms, and smart contracts engineered to be secure, scalable, and community-ready from day one.",
    benefits: [
      "Audited, battle-tested smart contract security",
      "Launch-ready from tokenomics to mint pages",
      "Scalable architecture for high on-chain volume",
      "Community-first product design",
    ],
    deliverables: [
      "Smart contract development",
      "Token and NFT launches",
      "DeFi and staking platforms",
      "NFT marketplace builds",
      "Security audits",
      "Web3 wallet integrations",
    ],
    idealFor: "Founders launching tokens, NFTs, or DeFi/Web3 products.",
  },
  "saas-development": {
    tagline: "From idea to launched product",
    summary:
      "Full-cycle SaaS development — design, build, and scale multi-tenant apps with robust APIs, subscription billing, and intuitive interfaces.",
    benefits: [
      "Faster time to market with proven stacks",
      "Multi-tenant architecture built to scale",
      "Revenue-ready with subscription billing wired in",
      "Delightful UX customers enjoy using",
    ],
    deliverables: [
      "Product design and UX",
      "Multi-tenant architecture",
      "Subscription billing integration",
      "Robust REST and API design",
      "Admin and analytics dashboards",
      "Cloud deployment and scaling",
    ],
    idealFor: "Founders and businesses building a software product from scratch or scaling one.",
  },
  "content-creation-influencer-marketing": {
    tagline: "Content that stops the scroll",
    summary:
      "Scroll-stopping content and influencer partnerships that drive real ROI — matching brands with the right creators and managing every campaign end to end.",
    benefits: [
      "Authentic reach through trusted creator audiences",
      "Premium video and visual content",
      "Managed end to end, from sourcing to reporting",
      "Measurable ROI against clear goals",
    ],
    deliverables: [
      "Creative content production",
      "Influencer sourcing and vetting",
      "Campaign management",
      "Short-form video and reels",
      "Contracts and negotiations",
      "ROI tracking and reporting",
    ],
    idealFor: "Brands wanting high-quality content and creator-led campaigns.",
  },
  "email-marketing": {
    tagline: "Turn inboxes into revenue",
    summary:
      "High-converting email campaigns, automated drip sequences, and newsletters that nurture leads and drive sales — with beautiful templates and data behind every send.",
    benefits: [
      "Higher conversions from segmented, personalized emails",
      "Automated nurture sequences that run 24/7",
      "Beautiful, on-brand, mobile-perfect templates",
      "Optimized by A/B testing and analytics",
    ],
    deliverables: [
      "Campaign strategy and planning",
      "Custom template design",
      "Automated drip sequences",
      "Audience segmentation",
      "A/B testing and optimization",
      "Open, click, and revenue analytics",
    ],
    idealFor: "Businesses with an email list who want to nurture and convert it.",
  },
};
