import { type GetStaticProps, type NextPage } from "next";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import { AdSenseUnit } from "~/component/AdSense";
import { buildCollectionPageSchema, buildItemListSchema } from "~/lib/seo";
import blogContent from "~/generated/blog-content.json";

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
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              From Our Blog
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Ideas and inspiration for gifts, decor, and celebrating the people
              you love.
            </p>
          </div>

          <div className="mb-12 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:grid-cols-3">
            <Link
              href="/personalized-gifts"
              className="rounded-xl border border-transparent p-4 transition hover:border-brand-400 hover:bg-brand-50"
            >
              <h2 className="text-lg font-semibold">Personalized Gifts</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Move from editorial inspiration into category pages built for
                gift intent.
              </p>
            </Link>
            <Link
              href="/name-art-generator"
              className="rounded-xl border border-transparent p-4 transition hover:border-brand-400 hover:bg-brand-50"
            >
              <h2 className="text-lg font-semibold">Create Name Art</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Start the core creation flow if you already know the style
                direction you want.
              </p>
            </Link>
            <Link
              href="/personalized-gifts"
              className="rounded-xl border border-transparent p-4 transition hover:border-brand-400 hover:bg-brand-50"
            >
              <h2 className="text-lg font-semibold">Couple Gifts</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Browse pages that connect couple art themes with stronger
                gifting intent.
              </p>
            </Link>
          </div>

          <AdSenseUnit className="mb-12" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map(({ slug, frontmatter }) => (
              <Link
                key={slug}
                href={`/blog/${slug}`}
                className="group block overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-gray-800"
              >
                <div className="relative">
                  <img
                    src={frontmatter.featuredImage}
                    alt={frontmatter.title}
                    className="h-56 w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="mb-2 text-sm font-semibold text-brand-600">
                    {frontmatter.category}
                  </p>
                  <h2 className="mb-3 text-xl font-bold transition-colors group-hover:text-brand-600">
                    {frontmatter.title}
                  </h2>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {frontmatter.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(frontmatter.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
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
  return {
    props: {
      posts: blogContent,
    },
  };
};

export default BlogIndexPage;
