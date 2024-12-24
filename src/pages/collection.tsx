import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api } from "~/utils/api";

const CollectionPage: NextPage = () => {

    const icons = api.icons.getIcons.useQuery();

    return (
    <>
    <Head>
        <title>Your images</title>
        <meta name="description" content="your images" />
        <link rel="icon" href="/favicon.ico" />
    </Head>
    <main className="flex min-h-screen mt-24 flex-col container mx-auto gap-4 px-8">
        <h1 className="text-4xl">Your Icons</h1>

        <ul className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {icons.data?.map((icon) => (
                <li key={icon.id}>
                    <Image 
                        className="w-full"
                        width="100"
                        height="100"
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

export default CollectionPage;
