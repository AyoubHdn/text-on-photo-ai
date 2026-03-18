import { type GetStaticProps, type NextPage } from "next";
import Link from "next/link";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { SeoHead } from "~/component/SeoHead";
import { buildCollectionPageSchema, buildItemListSchema } from "~/lib/seo";

// Define the type for the frontmatter object
interface PostFrontmatter {
  title: string;
  date: string;
  description: string;
  category: string;
  featuredImage: string;
  [key: string]: any; // Allows for other optional properties
}

// Define the type for a single post with its slug
interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
}

interface BlogIndexProps {
  posts: Post[];
}

const BlogIndexPage: NextPage<BlogIndexProps> = ({ posts }) => {
  const postPaths = posts.map((post) => `/blog/${post.slug}`);

  return (
    <>
      <SeoHead
        title="Name Design AI Blog | Personalized Gift and Name Art Ideas"
        description="Explore articles on personalized gifts, couple keepsakes, name art ideas, Arabic calligraphy inspiration, and product-ready design concepts from Name Design AI."
        path="/blog"
        jsonLd={[
          buildCollectionPageSchema({
            name: "Name Design AI Blog",
            description:
              "Editorial content about personalized name art, gifting ideas, and decor use cases.",
            path: "/blog",
            itemPaths: postPaths,
          }),
          buildItemListSchema({
            name: "Blog articles",
            itemPaths: postPaths,
          }),
        ]}
      />
      <main className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">From Our Blog</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ideas and inspiration for gifts, decor, and celebrating the people you love.
            </p>
          </div>

          <div className="mb-12 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:grid-cols-3">
            <Link href="/personalized-gifts" className="rounded-xl border border-transparent p-4 transition hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700">
              <h2 className="text-lg font-semibold">Personalized Gifts</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Move from editorial inspiration into category pages built for gift intent.
              </p>
            </Link>
            <Link href="/name-art" className="rounded-xl border border-transparent p-4 transition hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700">
              <h2 className="text-lg font-semibold">Name Art Generator</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Start the core creation flow if you already know the style direction you want.
              </p>
            </Link>
            <Link href="/couple-gifts" className="rounded-xl border border-transparent p-4 transition hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700">
              <h2 className="text-lg font-semibold">Couple Gifts</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Browse pages that connect couple art themes with stronger gifting intent.
              </p>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(({ slug, frontmatter }) => (
              <Link key={slug} href={`/blog/${slug}`} className="group block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="relative">
                  <img src={frontmatter.featuredImage} alt={frontmatter.title} className="w-full h-56 object-cover" />
                </div>
                <div className="p-6">
                  <p className="text-sm text-blue-500 font-semibold mb-2">{frontmatter.category}</p>
                  <h2 className="text-xl font-bold mb-3 group-hover:text-blue-500 transition-colors">{frontmatter.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{frontmatter.description}</p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(frontmatter.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

// This function runs at build time to get all the posts
// Removed 'async' as it's not needed for synchronous fs calls
export const getStaticProps: GetStaticProps = () => {
  const postsDirectory = path.join(process.cwd(), '_posts');
  const filenames = fs.readdirSync(postsDirectory);

  const posts = filenames.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, '');
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter } = matter(fileContents);

    return {
      slug,
      frontmatter,
    };
  }).sort((a, b) => {
    // Explicitly cast date to string to satisfy TypeScript
    const dateA = new Date(a.frontmatter.date as string).getTime();
    const dateB = new Date(b.frontmatter.date as string).getTime();
    return dateB - dateA; // Sort by most recent
  });

  return {
    props: {
      posts,
    },
  };
};

export default BlogIndexPage;
