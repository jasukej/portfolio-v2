"use client";

import { Mail, GitBranch, Globe, ArrowUpRight, type LucideIcon } from "lucide-react";
import { CONTACT, type ContactLinkIcon } from "@/data/contact";

const ICONS: Record<ContactLinkIcon, LucideIcon> = {
  mail: Mail,
  github: GitBranch,
  linkedin: Globe,
};

export default function ContactContent() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight">
          {CONTACT.heading}
        </h3>
        <p className="mt-1 text-[12px] text-navy/50">{CONTACT.subtitle}</p>
      </div>

      <div className="space-y-2">
        {CONTACT.links.map((link) => {
          const Icon = ICONS[link.icon];
          return (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 border border-navy/10 p-3 transition-colors hover:border-navy/25 hover:bg-navy/[0.02]"
            >
              <Icon size={16} className="shrink-0 text-navy/40" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-widest text-navy/30">
                  {link.label}
                </div>
                <div className="text-[12px] font-medium">{link.value}</div>
              </div>
              <ArrowUpRight
                size={14}
                className="shrink-0 text-navy/0 transition-colors group-hover:text-navy/40"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
