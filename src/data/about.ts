import type { WindowId } from "@/store/useWindowStore";

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
  tagline: "Software Engineer",
  currentlyDoing: ["Learning guitar", "Running", "Writing"],
  links: {
    github: "https://github.com/jasukej",
    ubc: "https://www.ubc.ca/",
    writing: "/blog",
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
          text: ". A big part of what motivates me is bringing people together + hosting cool experiences.",
        },
      ],
    },
    {
      type: "rich",
      parts: [
        { text: "I'm currently in NYC for the summer working on " },
        {
          window: {
            windowId: "experiences",
            label: "Rust-C++ interop",
            className: ABOUT_LINK_CLASS,
          },
        },
        { text: ". I enjoy " },
        {
          window: {
            windowId: "blog",
            label: "writing",
            className: ABOUT_LINK_CLASS,
          },
        },
        { text: ", whether that be technical deep-dives or reflections." },
      ],
    },
  ] satisfies AboutParagraph[],
} as const;
