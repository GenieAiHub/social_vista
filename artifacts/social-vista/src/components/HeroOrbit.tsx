import {
  SiInstagram,
  SiFacebook,
  SiTiktok,
  SiX,
  SiTelegram,
  SiYoutube,
  SiWhatsapp,
  SiMessenger,
} from "react-icons/si";
import type { IconType } from "react-icons";
import { Share2 } from "lucide-react";

const nodes: { Icon: IconType; color: string; label: string }[] = [
  { Icon: SiInstagram, color: "#E4405F", label: "Instagram" },
  { Icon: SiMessenger, color: "#0084FF", label: "Messenger" },
  { Icon: SiWhatsapp, color: "#25D366", label: "WhatsApp" },
  { Icon: SiYoutube, color: "#FF0000", label: "YouTube" },
  { Icon: SiTiktok, color: "#111827", label: "TikTok" },
  { Icon: SiTelegram, color: "#26A5E4", label: "Telegram" },
  { Icon: SiX, color: "#111827", label: "X" },
  { Icon: SiFacebook, color: "#1877F2", label: "Facebook" },
];

const RADIUS = 43; // percent of container

export default function HeroOrbit() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      {/* concentric rings */}
      <div className="absolute inset-0 rounded-full border border-primary/10" />
      <div className="absolute inset-[13%] rounded-full border border-primary/10" />
      <div className="absolute inset-[26%] rounded-full border border-primary/10" />

      {/* soft center glow */}
      <div className="absolute inset-[28%] rounded-full bg-gradient-brand opacity-20 blur-2xl animate-pulse" />

      {/* center brand badge */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-24 h-24 rounded-full bg-gradient-brand flex items-center justify-center glow-primary">
        <Share2 className="w-10 h-10 text-white" />
      </div>

      {/* orbiting platform nodes */}
      {nodes.map(({ Icon, color, label }, i) => {
        const angle = (-90 + i * (360 / nodes.length)) * (Math.PI / 180);
        const left = 50 + RADIUS * Math.cos(angle);
        const top = 50 + RADIUS * Math.sin(angle);
        return (
          <div
            key={label}
            className="orbit-node absolute w-14 h-14 rounded-2xl bg-white shadow-lg border border-border flex items-center justify-center hover:scale-110 transition-transform"
            style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${i * 0.35}s` }}
            aria-label={label}
          >
            <Icon className="w-7 h-7" style={{ color }} />
          </div>
        );
      })}
    </div>
  );
}
