import { type GetStaticPaths, type GetStaticProps, type NextPage } from "next";
import Link from "next/link";
import { AdSenseUnit } from "~/component/AdSense";
import { SeoHead } from "~/component/SeoHead";
import blogContent from "~/generated/blog-content.json";
import { buildArticleSchema, buildBreadcrumbSchema } from "~/lib/seo";

// Define a clear type for the frontmatter
interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  featuredImage: string;
  [key: string]: any;
}

interface PostPageProps {
  slug: string;
  frontmatter: PostFrontmatter;
  html: string;
}

const PostPage: NextPage<PostPageProps> = ({ slug, frontmatter, html }) => {
  const articlePath = `/blog/${slug}`;
  return (
    <>
      <SeoHead
        title={`${frontmatter.title} | Name Design AI Blog`}
        description={frontmatter.description}
        path={articlePath}
        image={frontmatter.featuredImage}
        imageAlt={frontmatter.title}
        type="article"
        jsonLd={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: frontmatter.title, path: articlePath },
          ]),
          buildArticleSchema({
            headline: frontmatter.title,
            description: frontmatter.description,
            path: articlePath,
            imagePath: frontmatter.featuredImage,
            datePublished: frontmatter.date,
            authorName:
              typeof frontmatter.author === "string"
                ? frontmatter.author
                : "Name Design AI Team",
          }),
        ]}
      />
      <main className="bg-white py-16 dark:bg-gray-900">
        <article className="container mx-auto max-w-3xl px-6">
          <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-brand-600">
              Home
            </Link>{" "}
            /{" "}
            <Link href="/blog" className="hover:text-brand-600">
              Blog
            </Link>{" "}
            / <span>{frontmatter.title}</span>
          </nav>
          <header className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              {frontmatter.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Posted on{" "}
              {new Date(frontmatter.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </header>

          <img
            src={frontmatter.featuredImage}
            alt={frontmatter.title}
            className="mb-12 h-auto w-full rounded-lg shadow-lg"
          />

          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <AdSenseUnit className="px-0" />

          <section className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Continue exploring
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Link
                href="/name-art"
                className="rounded-xl border border-transparent p-4 transition hover:border-brand-400 hover:bg-brand-50"
              >
                <h3 className="text-lg font-semibold">Name Art</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Start with the core name art page and generator.
                </p>
              </Link>
              <Link
                href="/personalized-gifts"
                className="rounded-xl border border-transparent p-4 transition hover:border-brand-400 hover:bg-brand-50"
              >
                <h3 className="text-lg font-semibold">Personalized Gifts</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Move from inspiration into category pages built around gift
                  intent.
                </p>
              </Link>
              <Link
                href="/personalized-gifts"
                className="rounded-xl border border-transparent p-4 transition hover:border-brand-400 hover:bg-brand-50"
              >
                <h3 className="text-lg font-semibold">Couple Gifts</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Explore romantic and occasion-based product ideas linked to
                  couple art.
                </p>
              </Link>
            </div>
          </section>
        </article>
      </main>
    </>
  );
};

// Removed 'async' as it is not needed
export const getStaticPaths: GetStaticPaths = () => {
  const paths = blogContent.map((post) => ({
    params: {
      slug: post.slug,
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  // Type safety check for slug
  const slug = context.params?.slug;
  if (typeof slug !== "string") {
    return { notFound: true };
  }

  const post = blogContent.find((entry) => entry.slug === slug);
  if (!post) return { notFound: true };

  return {
    props: {
      slug,
      frontmatter: post.frontmatter,
      html: post.html,
    },
  };
};

export default PostPage;
