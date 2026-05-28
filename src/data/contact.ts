export type ContactLinkIcon = "mail" | "github" | "linkedin";

export type ContactLink = {
  label: string;
  value: string;
  href: string;
  icon: ContactLinkIcon;
};

export const CONTACT = {
  heading: "Get in touch",
  subtitle: "Always happy to chat!",
  links: [
    {
      label: "Email",
      value: "roselinakeziarijadi@gmail.com",
      href: "mailto:roselinakeziarijadi@gmail.com",
      icon: "mail",
    },
    {
      label: "GitHub",
      value: "github.com/jasukej",
      href: "https://github.com/jasukej",
      icon: "github",
    },
    {
      label: "LinkedIn",
      value: "linkedin.com/in/krijadi",
      href: "https://linkedin.com/in/krijadi",
      icon: "linkedin",
    },
  ] satisfies ContactLink[],
} as const;
