import { type GetStaticPaths, type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Link from "next/link";
import { Button } from "~/component/Button";

// Define a clear type for the frontmatter
interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  featuredImage: string;
  [key: string]: any;
}

interface PostPageProps {
  frontmatter: PostFrontmatter;
  source: MDXRemoteSerializeResult; // Changed prop name to 'source'
}

// Custom components to be used within your MDX files
// Ensure this component exists if you plan to use it in MDX
const CTA = ({ title, description, href, buttonText }: { title: string, description: string, href: string, buttonText: string }) => (
    <div className="my-12 p-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 mb-6 text-lg text-gray-700 dark:text-gray-300">{description}</p>
        <Link href={href}>
            <Button>{buttonText}</Button>
        </Link>
    </div>
);

const components = {
  h2: (props: any) => <h2 className="text-3xl font-bold mt-12 mb-4" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-semibold mt-8 mb-4" {...props} />,
  p: (props: any) => <p className="text-lg leading-relaxed mb-6" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside mb-6 pl-4" {...props} />,
  li: (props: any) => <li className="mb-2" {...props} />,
  CTA,
};

const PostPage: NextPage<PostPageProps> = ({ frontmatter, source }) => {
  return (
    <>
      <Head>
        <title>{frontmatter.title} | Name Design AI Blog</title>
        <meta name="description" content={frontmatter.description} />
      </Head>
      <main className="bg-white dark:bg-gray-900 py-16">
        <article className="container mx-auto px-6 max-w-3xl">
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{frontmatter.title}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Posted on {new Date(frontmatter.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </header>
          
          <img src={frontmatter.featuredImage} alt={frontmatter.title} className="w-full h-auto rounded-lg shadow-lg mb-12"/>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
             {/* Use the 'source' prop here */}
            <MDXRemote {...source} components={components} />
          </div>
        </article>
      </main>
    </>
  );
};


// Removed 'async' as it is not needed
export const getStaticPaths: GetStaticPaths = () => {
  const postsDirectory = path.join(process.cwd(), '_posts');
  const filenames = fs.readdirSync(postsDirectory);
  const paths = filenames.map((filename) => ({
    params: {
      slug: filename.replace(/\.mdx?$/, ''),
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

// Marked as async because 'serialize' is an async function
export const getStaticProps: GetStaticProps = async (context) => {
  // Type safety check for slug
  const slug = context.params?.slug;
  if (typeof slug !== 'string') {
    return { notFound: true };
  }

  const filePath = path.join(process.cwd(), '_posts', `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const { data: frontmatter, content } = matter(fileContents);

  const mdxSource = await serialize(content, {
    mdxOptions: {
      // Potentially add MDX plugins here if needed
    },
    parseFrontmatter: false,
  });

  return {
    props: {
      frontmatter,
      source: mdxSource, // Pass the serialized content to the 'source' prop
    },
  };
};

export default PostPage;