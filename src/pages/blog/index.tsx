import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
  return (
    <>
      <Head>
        <title>Our Blog | Creative Ideas & Inspiration | Name Design AI</title>
        <meta
          name="description"
          content="Explore articles on personalized gifting, home decor, family heritage, and creative inspiration from the team at Name Design AI."
        />
      </Head>
      <main className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">From Our Blog</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ideas and inspiration for gifts, decor, and celebrating the people you love.
            </p>
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