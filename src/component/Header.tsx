import { useState, useEffect, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./Button";
import { PrimaryLink } from "./PrimaryLink";
import { api } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";

export function Header() {
    const session = useSession();
    const credits = api.user.getCredits.useQuery();
    const isLoggedIn = !!session.data;

    // State for toggling the dropdown menu
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Reference to the dropdown for detecting outside clicks
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (dropdownRef.current && !(dropdownRef.current as HTMLElement).contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleOutsideClick);
        } else {
            document.removeEventListener("mousedown", handleOutsideClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isDropdownOpen]);

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
                    <PrimaryLink href="/" className="inline-block md:hidden xl:inline-block">
                        <strong>Name Design AI</strong>
                    </PrimaryLink>
                </li>
                <li>
                    <PrimaryLink id="generate-header-button" href="/generate" className="hidden md:block">
                        Generate
                    </PrimaryLink>
                </li>
                <li>
                    <PrimaryLink id="community-header-button" href="/community" className="hidden md:block">
                        Community
                    </PrimaryLink>
                </li>
                {isLoggedIn && (
                    <li>
                        <PrimaryLink id="collection-header-button" href="/collection" className="hidden md:block">
                            Collection
                        </PrimaryLink>
                    </li>
                )}
            </ul>
            <ul className="hidden gap-4 items-center md:flex">
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
                                <Button id="buy-credits-header-button" >Buy Credits</Button>
                            </PrimaryLink>
                        </li>
                        <li>
                            <Button
                                id="SignOut-header-button"
                                variant="secondary"
                                onClick={() => {
                                    signOut().catch(console.error);
                                }}
                            >
                                Sign Out
                            </Button>
                        </li>
                    </>
                )}
                {!isLoggedIn && (
                    <li>
                        <Button
                            id="signIn-header-button"
                            onClick={() => {
                                signIn().catch(console.error);
                            }}
                        >
                            Sign In
                        </Button>
                    </li>
                )}
            </ul>
            {/* Dropdown Toggle Button */}
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative focus:outline-none md:hidden"
            >
                {isDropdownOpen ? "X" : "☰"}
            </button>
            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div ref={dropdownRef} className="absolute top-14 z-10 w-full p-4 md:block md:w-auto">
                    <ul className="rounded-lg bg-white p-4 text-slate-800 dark:bg-gray-900 dark:text-slate-200">
                        {isLoggedIn && (
                            <>
                                <li>
                                    <Link
                                        id="buy-credits-header-button"
                                        href="/buy-credits"
                                        className="block px-4 py-2 dark:text-white hover:bg-gray-700"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Buy Credits ({credits.data ?? 0} credits left)
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        id="generate-header-button"
                                        href="/generate"
                                        className="block px-4 py-2 dark:text-white hover:bg-gray-700"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Generate
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        id="community-header-button"
                                        href="/community"
                                        className="block px-4 py-2 dark:text-white hover:bg-gray-700"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Community
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        id="collection-header-button"
                                        href="/collection"
                                        className="block px-4 py-2 dark:text-white hover:bg-gray-700"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Collection
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        id="SignOut-header-button"
                                        onClick={() => {
                                            signOut().catch(console.error);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 dark:text-white hover:bg-gray-700"
                                    >
                                        Sign Out
                                    </button>
                                </li>
                            </>
                        )}
                        {!isLoggedIn && (
                            <>
                                <li>
                                    <button
                                        id="SignIn-header-button"
                                        onClick={() => {
                                            signIn().catch(console.error);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 dark:text-white hover:bg-gray-700"
                                    >
                                        Sign In
                                    </button>
                                </li>
                                <li>
                                    <Link
                                        id="generate-header-button"
                                        href="/generate"
                                        className="block px-4 py-2 dark:text-white hover:bg-gray-700"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Generate
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        id="community-header-button"
                                        href="/community"
                                        className="block px-4 py-2 dark:text-white hover:bg-gray-700"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Community
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
}
