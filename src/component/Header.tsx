import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./Button";
import { PrimaryLink } from "./PrimaryLink"
import { useBuyCredits } from "~/hook/useBuyCredits";
import { api } from "~/utils/api";

export function Header() {

    const session = useSession();
    const {buyCredits} = useBuyCredits();

    const credits = api.user.getCredits.useQuery();

    const isLoggedIn = !!session.data;

    return (
        <header className="container mx-auto flex h-16 items-center justify-between px-4 dark:bg-gray-800">
            <PrimaryLink href="/">Logo</PrimaryLink>
            <ul className="flex gap-4">
                <li>
                    <PrimaryLink href="/generate">Generate</PrimaryLink>
                </li>
                <li>
                    <PrimaryLink href="/community">Cummunity</PrimaryLink>
                </li>
                {isLoggedIn && (
                <li>
                    <PrimaryLink href="/collection">Collection</PrimaryLink>
                </li>
                )}
            </ul>
            <ul className="flex gap-4">
                {isLoggedIn && (
                <>
                    <div className="flex items-center">Cridets remainning {credits.data} </div>
                    <li>
                        <Button
                            onClick={() => {
                                buyCredits().catch(console.error);
                            }}
                            >
                            Buy Credits
                        </Button>
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