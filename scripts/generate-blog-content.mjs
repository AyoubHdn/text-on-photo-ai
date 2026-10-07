import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

const root = process.cwd();
const postsDirectory = path.join(root, "_posts");
const outputPath = path.join(root, "src", "generated", "blog-content.json");

/** @param {{ title: string, description: string, href: string, buttonText: string }} props */
const CTA = ({ title, description, href, buttonText }) =>
  React.createElement(
    "div",
    {
      className:
        "my-12 rounded-r-lg border-l-4 border-brand-500 bg-brand-50 p-8",
    },
    React.createElement(
      "h3",
      { className: "text-2xl font-bold text-gray-900 dark:text-white" },
      title
    ),
    React.createElement(
      "p",
      { className: "mt-2 mb-6 text-lg text-gray-700 dark:text-gray-300" },
      description
    ),
    React.createElement(
      "a",
      {
        href,
        className:
          "flex items-center justify-center gap-2 rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700",
      },
      buttonText
    )
  );

const components = {
  /** @param {any} props */
  h2: (props) =>
    React.createElement("h2", {
      ...props,
      className: "mt-12 mb-4 text-3xl font-bold",
    }),
  /** @param {any} props */
  h3: (props) =>
    React.createElement("h3", {
      ...props,
      className: "mt-8 mb-4 text-2xl font-semibold",
    }),
  /** @param {any} props */
  p: (props) =>
    React.createElement("p", {
      ...props,
      className: "mb-6 text-lg leading-relaxed",
    }),
  /** @param {any} props */
  ul: (props) =>
    React.createElement("ul", {
      ...props,
      className: "mb-6 list-inside list-disc pl-4",
    }),
  /** @param {any} props */
  li: (props) => React.createElement("li", { ...props, className: "mb-2" }),
  CTA,
};

const filenames = fs
  .readdirSync(postsDirectory)
  .filter((filename) => /\.mdx?$/.test(filename))
  .sort();

const entries = [];
for (const filename of filenames) {
  const source = fs.readFileSync(path.join(postsDirectory, filename), "utf8");
  const { data: frontmatter, content } = matter(source);
  const serialized = await serialize(content, { parseFrontmatter: false });
  const element = React.createElement(MDXRemote, { ...serialized, components });
  const html = renderToStaticMarkup(element);

  entries.push({
    slug: filename.replace(/\.mdx?$/, ""),
    frontmatter,
    html,
  });
}

entries.sort(
  (a, b) =>
    new Date(b.frontmatter.date).getTime() -
    new Date(a.frontmatter.date).getTime()
);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(
  `Generated ${entries.length} blog posts at ${path.relative(root, outputPath)}`
);
