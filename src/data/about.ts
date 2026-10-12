import type { ExperiencesTab, WindowId } from "@/store/useWindowStore";

export type AboutTextPart = { text: string };

/** Shared Tailwind class for inline About links */
export const ABOUT_LINK_CLASS = "cursor-pointer";

export type AboutExternalLink = {
  href: string;
  label: string;
  className: typeof ABOUT_LINK_CLASS;
};

export type AboutWindowLink = {
  windowId: WindowId;
  label: string;
  className: typeof ABOUT_LINK_CLASS;
  experiencesTab?: ExperiencesTab;
};

export type AboutParagraph =
  | { type: "plain"; text: string }
  | {
      type: "rich";
      parts: (AboutTextPart | { external: AboutExternalLink } | { window: AboutWindowLink })[];
    };

export const ABOUT = {
  name: "Kez",
  fullName: "Roselina Kezia Rijadi",
  tagline: "Software Engineer & CS @ University of British Columbia",
  currentlyDoing: ["Drawing", "Munching (add me on beli: @keziwezi)", "Writing"],
  links: {
    github: "https://github.com/jasukej",
    ubc: "https://www.ubc.ca/",
    writing: "/blog",
    linkedin: "https://linkedin.com/in/krijadi",
  },
  paragraphs: [
    {
      type: "plain",
      text: "Hi! I'm Kez. Welcome to my humble corner of the internet :]",
    },
    {
      type: "rich",
      parts: [
        { text: "I go to " },
        // TODO: make separate education window for awards + gpa
        {
          external: {
            href: "https://www.ubc.ca/",
            label: "school in Vancouver",
            className: ABOUT_LINK_CLASS,
          },
        },
        { text: " and I " },
        {
          window: {
            windowId: "projects",
            label: "code sometimes",
            className: ABOUT_LINK_CLASS,
          },
        },
        {
          text: ". I like programming languages and operating systems, and generally, thinking up better abstractions. ",
        },
        {
          window: {
            windowId: "experiences",
            label: "Community",
            className: ABOUT_LINK_CLASS,
            experiencesTab: "Organizations",
          },
        },
        {
          text: " has been a huge part of my story, and I extend that joy by hosting events for my university, my friends, and family.",
        },
      ],
    },
    {
      type: "rich",
      parts: [
        { text: "Over the summer, I worked on " },
        {
          window: {
            windowId: "experiences",
            label: "Rust-C++ interop",
            className: ABOUT_LINK_CLASS,
          },
        },
        { text: " at Google. Currently, I'm doing research on evaluating a verified semantics of the eBPF verifier, as part of my directed studies. I'm excited about a lot of things, and I write about some of them " },
        {
          window: {
            windowId: "blog",
            label: "here",
            className: ABOUT_LINK_CLASS,
          },
        },
        { text: "." },
      ],
    },
  ] satisfies AboutParagraph[],
} as const;
