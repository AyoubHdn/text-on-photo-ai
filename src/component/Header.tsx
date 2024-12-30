import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./Button";
import { PrimaryLink } from "./PrimaryLink";
import { api } from "~/utils/api";
import Image from "next/image";

export function Header() {
    const session = useSession();

    const credits = api.user.getCredits.useQuery();

    const isLoggedIn = !!session.data;

    return (
        <header className="container mx-auto flex h-16 items-center justify-between px-4 dark:bg-gray-800">
            <ul className="flex gap-8 items-center">
                <li>
                    <PrimaryLink href="/">
                        <Image
                            src="/logo.png" // Replace with your actual logo path
                            alt="Logo"
                            width={50}
                            height={50}
                            className="rounded"
                        />
                    </PrimaryLink>
                </li>
                <li>
                    <PrimaryLink href="/"><strong>Name Desing AI</strong></PrimaryLink>
                </li>
                <li>
                    <PrimaryLink href="/generate">Generate</PrimaryLink>
                </li>
                <li>
                    <PrimaryLink href="/community">Community</PrimaryLink>
                </li>
                {isLoggedIn && (
                    <li>
                        <PrimaryLink href="/collection">Collection</PrimaryLink>
                    </li>
                )}
            </ul>
            <ul className="flex gap-4 items-center">
                {isLoggedIn && (
                    <>
                        <li className="flex items-center gap-2">
    <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white text-sm font-bold rounded-full">
        {credits.data ?? 0}
    </div>
    <span className="text-sm font-medium text-gray-500">Credits</span>
</li>


                        <li>
                            <PrimaryLink href="/buy-credits">
                                <Button>Buy Credits</Button>
                            </PrimaryLink>
                        </li>
                        <li>
                            <Button variant="secondary" onClick={() => {
                                signOut().catch(console.error);
                            }}>
                                Logout
                            </Button>
                        </li>
                    </>
                )}
                {!isLoggedIn && (
                    <li>
                        <Button onClick={() => {
                            signIn().catch(console.error);
                        }}>
                            Login
                        </Button>
                    </li>
                )}
            </ul>
        </header>
    );
}
