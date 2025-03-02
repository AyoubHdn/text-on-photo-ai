import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api } from "~/utils/api";

const CommunityPage: NextPage = () => {

    const icons = api.icons.getCommunityIcons.useQuery();

    return (
    <>
    <Head>
        <title>Community Gallery | User-Generated Images on Name Design AI</title>
        <meta name="description" content="Browse all user-generated images on Name Design AI. Explore creative designs crafted by our community and find inspiration for your next project." />
        <link rel="icon" href="/favicon.ico" />
    </Head>
    <main className="flex min-h-screen mt-24 flex-col container mx-auto gap-4 px-8">
        <h1 className="text-4xl">Community Gallery</h1>

        <ul className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {icons.data?.map((icon) => (
                <li key={icon.id}>
                    <Image 
                        className="rounded w-full"
                        width="512"
                        height="512"
                        alt={icon.prompt ?? "an image of an icon"}
                        src={`https://name-design-ai.s3.us-east-1.amazonaws.com/${icon.id}`}
                    />
                </li>
            ))}
            
        </ul>
    </main>
    </>
  );
};

export default CommunityPage;
