import { Share2, Bot, MessageCircle, Video, Code2, Coins, Layers, PenTool, Mail } from "lucide-react";

import socialMediaImg from "@/assets/services/social-media-management.png";
import whatsappChatbotImg from "@/assets/services/whatsapp-chatbot.png";
import whatsappCampaignsImg from "@/assets/services/whatsapp-messaging-campaigns.png";
import zoomImg from "@/assets/services/zoom-meetings-manager.png";
import consultancyImg from "@/assets/services/software-consultancy.png";
import web3Img from "@/assets/services/crypto-web3-projects.png";
import saasImg from "@/assets/services/saas-development.png";
import contentImg from "@/assets/services/content-creation-influencer-marketing.png";
import emailImg from "@/assets/services/email-marketing.png";

export const iconMap: Record<string, React.ElementType> = {
  Share2, Bot, MessageCircle, Video, Code2, Coins, Layers, PenTool, Mail,
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface Benefit {
  title: string;
  description: string;
}

export interface ServiceContent {
  image: string;
  tagline: string;
  intro: string;
  benefits: Benefit[];
  features: string[];
}

/** Rich landing-page content keyed by service slug. */
export const serviceContent: Record<string, ServiceContent> = {
  "social-media-management": {
    image: socialMediaImg,
    tagline: "Grow a brand people love to follow",
    intro:
      "We run your social presence end to end — strategy, content, scheduling, and community — so your brand stays consistent, on-trend, and always growing across every platform.",
    benefits: [
      { title: "Consistent Growth", description: "Data-driven content calendars that steadily expand your reach and follower base month over month." },
      { title: "Higher Engagement", description: "Posts crafted to spark comments, shares, and saves — not just passive likes." },
      { title: "Save Hours Weekly", description: "We handle planning, design, and posting so your team can focus on the business." },
      { title: "Clear Reporting", description: "Monthly analytics that tie social activity to real business outcomes." },
    ],
    features: [
      "Multi-platform strategy (Instagram, Facebook, X, LinkedIn, TikTok)",
      "Branded content & graphics creation",
      "Content calendar & scheduling",
      "Community management & DMs",
      "Hashtag & trend research",
      "Monthly performance reports",
    ],
  },
  "whatsapp-chatbot": {
    image: whatsappChatbotImg,
    tagline: "Answer every customer, 24/7",
    intro:
      "AI-powered WhatsApp chatbots that qualify leads, answer FAQs, track orders, and book appointments around the clock — so no customer is ever left waiting.",
    benefits: [
      { title: "Instant Responses", description: "Customers get answers in seconds, any time of day, in any time zone." },
      { title: "More Qualified Leads", description: "Smart flows capture and qualify leads before they reach your team." },
      { title: "Lower Support Costs", description: "Automate repetitive questions and free up your support staff." },
      { title: "Seamless Handoff", description: "Complex queries route smoothly to a human when needed." },
    ],
    features: [
      "Natural-language AI conversations",
      "Lead qualification & capture",
      "Order tracking & FAQs",
      "Appointment booking flows",
      "CRM & spreadsheet integrations",
      "Human handoff when required",
    ],
  },
  "whatsapp-messaging-campaigns": {
    image: whatsappCampaignsImg,
    tagline: "Reach thousands with one tap",
    intro:
      "Broadcast personalized WhatsApp campaigns to your opted-in audience with rich media, smart segmentation, and real-time delivery analytics that make every send count.",
    benefits: [
      { title: "98% Open Rates", description: "WhatsApp messages get seen — far more than email ever could." },
      { title: "Personalized at Scale", description: "Dynamic fields make every message feel one-to-one." },
      { title: "Rich Media", description: "Send images, videos, catalogs, and buttons that drive action." },
      { title: "Real-Time Analytics", description: "Track delivery, reads, and clicks as the campaign runs." },
    ],
    features: [
      "Opt-in list management",
      "Audience segmentation",
      "Personalized broadcast messages",
      "Rich media & interactive buttons",
      "Delivery & read analytics",
      "Compliance & consent handling",
    ],
  },
  "zoom-meetings-manager": {
    image: zoomImg,
    tagline: "Never miss a client call again",
    intro:
      "End-to-end Zoom scheduling and automation — booking links, reminders, and follow-ups — so your meetings run themselves and your clients always show up.",
    benefits: [
      { title: "Fewer No-Shows", description: "Automated reminders keep attendance high and calendars full." },
      { title: "Effortless Booking", description: "Clients pick a slot in seconds with smart scheduling links." },
      { title: "Automated Follow-Ups", description: "Post-meeting emails and notes sent without lifting a finger." },
      { title: "Organized Pipeline", description: "Every meeting logged and tracked in one place." },
    ],
    features: [
      "Automated booking links",
      "Calendar sync & availability",
      "Email & WhatsApp reminders",
      "Post-meeting follow-ups",
      "Recurring meeting management",
      "Attendance tracking",
    ],
  },
  "software-consultancy": {
    image: consultancyImg,
    tagline: "Expert guidance for your tech stack",
    intro:
      "Align your software with your business goals. From architecture reviews to digital transformation roadmaps, we help you build the right thing, the right way.",
    benefits: [
      { title: "Avoid Costly Mistakes", description: "Validate decisions before you invest in the wrong technology." },
      { title: "Faster Delivery", description: "Streamlined architecture and processes that ship quicker." },
      { title: "Scalable Foundations", description: "Systems designed to grow with your business, not against it." },
      { title: "Vendor-Neutral Advice", description: "Honest recommendations focused on your success, not a sale." },
    ],
    features: [
      "Architecture & code reviews",
      "Technology selection",
      "Digital transformation roadmaps",
      "Performance & security audits",
      "Team & process optimization",
      "Ongoing advisory support",
    ],
  },
  "crypto-web3-projects": {
    image: web3Img,
    tagline: "Build the decentralized future",
    intro:
      "Token launches, NFT marketplaces, DeFi platforms, and smart contracts — engineered to be secure, scalable, and community-ready from day one.",
    benefits: [
      { title: "Battle-Tested Security", description: "Audited smart contracts that protect your users and funds." },
      { title: "Launch-Ready", description: "Everything from tokenomics to mint pages, done right." },
      { title: "Scalable Architecture", description: "Built to handle growth and high-volume on-chain activity." },
      { title: "Community First", description: "Products designed to attract and retain an engaged community." },
    ],
    features: [
      "Smart contract development",
      "Token & NFT launches",
      "DeFi & staking platforms",
      "NFT marketplace builds",
      "Security audits",
      "Web3 wallet integrations",
    ],
  },
  "saas-development": {
    image: saasImg,
    tagline: "From idea to launched product",
    intro:
      "Full-cycle SaaS development. We design, build, and scale multi-tenant applications with robust APIs, subscription billing, and beautiful, intuitive interfaces.",
    benefits: [
      { title: "Faster Time to Market", description: "Proven stacks and processes get you live sooner." },
      { title: "Built to Scale", description: "Multi-tenant architecture ready for thousands of users." },
      { title: "Revenue-Ready", description: "Subscription billing and plans wired in from the start." },
      { title: "Delightful UX", description: "Interfaces your customers actually enjoy using." },
    ],
    features: [
      "Product design & UX",
      "Multi-tenant architecture",
      "Subscription billing integration",
      "Robust REST & API design",
      "Admin & analytics dashboards",
      "Cloud deployment & scaling",
    ],
  },
  "content-creation-influencer-marketing": {
    image: contentImg,
    tagline: "Content that stops the scroll",
    intro:
      "Scroll-stopping content and influencer partnerships that drive real ROI. We match your brand with the right creators and manage every campaign end to end.",
    benefits: [
      { title: "Authentic Reach", description: "Tap into trusted creator audiences that actually convert." },
      { title: "Premium Content", description: "Polished video and visuals that elevate your brand." },
      { title: "Managed End to End", description: "From creator sourcing to contracts to reporting — handled." },
      { title: "Measurable ROI", description: "Campaigns tracked against clear performance goals." },
    ],
    features: [
      "Creative content production",
      "Influencer sourcing & vetting",
      "Campaign management",
      "Short-form video & reels",
      "Contracts & negotiations",
      "ROI tracking & reporting",
    ],
  },
  "email-marketing": {
    image: emailImg,
    tagline: "Turn inboxes into revenue",
    intro:
      "High-converting email campaigns, automated drip sequences, and newsletters that nurture leads and drive sales — with beautiful templates and data behind every send.",
    benefits: [
      { title: "Higher Conversions", description: "Segmented, personalized emails that turn subscribers into buyers." },
      { title: "Automated Nurture", description: "Drip sequences that work for you around the clock." },
      { title: "Beautiful Templates", description: "On-brand, mobile-perfect designs your audience loves to open." },
      { title: "Optimized by Data", description: "A/B testing and analytics to improve every campaign." },
    ],
    features: [
      "Campaign strategy & planning",
      "Custom template design",
      "Automated drip sequences",
      "Audience segmentation",
      "A/B testing & optimization",
      "Open, click & revenue analytics",
    ],
  },
};
