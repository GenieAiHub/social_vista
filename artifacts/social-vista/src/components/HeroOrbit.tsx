import { SiInstagram, SiFacebook, SiX, SiTiktok, SiYoutube, SiWhatsapp } from "react-icons/si";
import { Linkedin, TrendingUp } from "lucide-react";

const icons = [
  { Icon: SiInstagram, color: "text-[#E1306C]", label: "Instagram" },
  { Icon: SiFacebook, color: "text-[#1877F2]", label: "Facebook" },
  { Icon: SiX, color: "text-foreground", label: "X" },
  { Icon: Linkedin, color: "text-[#0A66C2]", label: "LinkedIn" },
  { Icon: SiTiktok, color: "text-foreground", label: "TikTok" },
  { Icon: SiYoutube, color: "text-[#FF0000]", label: "YouTube" },
  { Icon: SiWhatsapp, color: "text-[#25D366]", label: "WhatsApp" },
];

const ringInner = 110;
const ringOuter = 180;

export default function HeroOrbit() {
  const innerIcons = icons.slice(0, 4);
  const outerIcons = icons.slice(4);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]" aria-hidden="true">
      {/* Decorative rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" style={{ width: ringInner * 2, height: ringInner * 2 }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-accent/20" style={{ width: ringOuter * 2, height: ringOuter * 2 }} />

      {/* Inner ring */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: ringInner * 2, height: ringInner * 2 }}>
        <div className="orbit-spin relative h-full w-full">
          {innerIcons.map(({ Icon, color, label }, i) => {
            const angle = (i / innerIcons.length) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * ringInner;
            const y = Math.sin(angle) * ringInner;
            return (
              <div key={label} className="orbit-node absolute left-1/2 top-1/2" style={{ marginLeft: x, marginTop: y }}>
                <div className="orbit-counter flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-lg ring-1 ring-border">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outer ring (reverse) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: ringOuter * 2, height: ringOuter * 2 }}>
        <div className="orbit-spin-reverse relative h-full w-full">
          {outerIcons.map(({ Icon, color, label }, i) => {
            const angle = (i / outerIcons.length) * 2 * Math.PI + Math.PI / 6;
            const x = Math.cos(angle) * ringOuter;
            const y = Math.sin(angle) * ringOuter;
            return (
              <div key={label} className="orbit-node absolute left-1/2 top-1/2" style={{ marginLeft: x, marginTop: y }}>
                <div className="orbit-counter-reverse flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-lg ring-1 ring-border">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center hub */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="hero-hub-pulse flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-xl glow-primary">
          <TrendingUp className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
