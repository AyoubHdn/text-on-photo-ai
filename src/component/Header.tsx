import { useState, useEffect, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./Button";
import { PrimaryLink } from "./PrimaryLink";
import { api } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";
import { AiOutlineDown } from "react-icons/ai"; // Using an icon for the dropdown

type HeaderProps = {
    minimal?: boolean;
    forceLight?: boolean;
};

export function Header({ minimal = false, forceLight = false }: HeaderProps) {
    const session = useSession();
    const credits = api.user.getCredits.useQuery();
    const isLoggedIn = !!session.data;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);

    const mobileMenuRef = useRef<HTMLDivElement>(null);
    // --- FIX: Changed from HTMLDivElement to HTMLLIElement to match the <li> it references ---
    const productsDropdownRef = useRef<HTMLLIElement>(null);

    const productLinks = [
        { href: "/name-art", name: "Name Art" },
        { href: "/arabic-name-art", name: "Arabic Name Art" },
        { href: "/couples-art", name: "Couples Art" },
    ];

    // Close mobile dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (mobileMenuRef.current && !(mobileMenuRef.current as HTMLElement).contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Close products dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (productsDropdownRef.current && !(productsDropdownRef.current as HTMLElement).contains(event.target as Node)) {
                setIsProductsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);


    if (minimal) {
        return (
            <header
                className={
                    forceLight
                        ? "flex h-16 w-full items-center justify-center bg-[#1B2538] px-4"
                        : "container mx-auto flex h-16 items-center justify-center px-4 dark:bg-gray-800"
                }
            >
                <PrimaryLink href="/" aria-label="Name Design AI Home" className="flex items-center gap-2">
                    <Image
                        src="/logo.webp"
                        alt="Name Design AI Logo"
                        width={50}
                        height={50}
                        className="rounded"
                        unoptimized={true}
                    />
                    <span className={`text-sm font-semibold sm:text-base ${forceLight ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                        Name Design AI
                    </span>
                </PrimaryLink>
            </header>
        );
    }

    return (
        <header className={`container mx-auto flex h-16 items-center justify-between px-4 ${forceLight ? "" : "dark:bg-gray-800"}`}>
            {/* --- LEFT NAVIGATION --- */}
            <ul className="flex gap-8 items-center">
                <li>
                    <PrimaryLink href="/">
                        <Image
                            src="/logo.webp"
                            alt="Name Design AI Logo"
                            width={50}
                            height={50}
                            className="rounded"
                            unoptimized={true}
                        />
                    </PrimaryLink>
                </li>
                <li>
                    <PrimaryLink href="/" className="inline-block md:hidden xl:inline-block">
                        <strong>Name Design AI</strong>
                    </PrimaryLink>
                </li>
                {/* --- START: NEW PRODUCTS DROPDOWN --- */}
                <li ref={productsDropdownRef} className="relative hidden md:block">
                    <button
                        onClick={() => setIsProductsDropdownOpen(prev => !prev)}
                        className={`flex items-center gap-1 font-medium hover:text-blue-500 ${forceLight ? "text-slate-800" : "text-slate-800 dark:text-slate-200"}`}
                    >
                        Create <AiOutlineDown size={14} className={`transition-transform ${isProductsDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isProductsDropdownOpen && (
                        <div className={`absolute top-full left-0 mt-2 w-56 z-20 rounded-md border bg-white shadow-lg ${forceLight ? "border-gray-200" : "dark:border-gray-600 dark:bg-gray-700"}`}>
                            <ul className="py-1">
                                {productLinks.map(link => (
                                    <li key={link.href}>
                                        <Link 
                                            href={link.href}
                                            onClick={() => setIsProductsDropdownOpen(false)}
                                            className={`block px-4 py-2 text-sm hover:bg-gray-100 ${forceLight ? "text-gray-700" : "text-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"}`}
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </li>
                {/* --- END: NEW PRODUCTS DROPDOWN --- */}
                <li>
                    <PrimaryLink id="community-header-button" href="/community" className="hidden md:block">
                        Gallery
                    </PrimaryLink>
                </li>
                <li>
                    <PrimaryLink href="/personalized-gifts" className="hidden md:block">
                        Gift Ideas
                    </PrimaryLink>
                </li>
                <li>
                    <PrimaryLink href="/products" className="hidden md:block">
                        Products
                    </PrimaryLink>
                </li>
                <li>
                    <PrimaryLink href="/blog" className="hidden md:block">
                        Blog
                    </PrimaryLink>
                </li>
                {isLoggedIn && (
                    <li>
                        <PrimaryLink id="collection-header-button" href="/collection" className="hidden md:block">
                            My Designs
                        </PrimaryLink>
                    </li>
                )}
                <li>
                    <PrimaryLink id="pricing-header-button" href="/buy-credits" className="hidden md:block">
                        Pricing
                    </PrimaryLink>
                </li>
            </ul>

            {/* --- RIGHT NAVIGATION (DESKTOP) --- */}
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

            {/* --- MOBILE HAMBURGER MENU --- */}
            <button
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="relative focus:outline-none md:hidden text-2xl"
            >
                {isMobileMenuOpen ? "×" : "☰"}
            </button>
            {isMobileMenuOpen && (
                <div ref={mobileMenuRef} className="absolute top-16 left-0 right-0 z-10 p-4 md:hidden">
                    <ul className={`rounded-lg bg-white p-4 text-slate-800 shadow-lg ${forceLight ? "" : "dark:bg-gray-900 dark:text-slate-200"}`}>
                        {isLoggedIn ? (
                            <>
                                <li>
                                        <Link href="/buy-credits" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Buy Credits ({credits.data ?? 0} left)
                                    </Link>
                                </li>
                                {/* --- START: Mobile Products Section --- */}
                                <li className="px-4 py-2 font-bold text-gray-500">Products</li>
                                {productLinks.map(link => (
                                     <li key={link.href} className="pl-4">
                                         <Link href={link.href} className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                             {link.name}
                                         </Link>
                                     </li>
                                ))}
                                <div className="my-2 border-t border-gray-700"></div> 
                                {/* --- END: Mobile Products Section --- */}
                                <li>
                                    <Link href="/products" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Products
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/personalized-gifts" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Gift Ideas
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/community" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Community
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/blog" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/collection" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        My Designs
                                    </Link>
                                </li>
                                <li>
                                    <button onClick={() => { signOut().catch(console.error); setIsMobileMenuOpen(false); }} className={`block w-full px-4 py-2 text-left ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`}>
                                        Sign Out
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <button onClick={() => { signIn().catch(console.error); setIsMobileMenuOpen(false); }} className={`block w-full px-4 py-2 text-left ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`}>
                                        Sign In
                                    </button>
                                </li>
                                 {/* --- START: Mobile Products Section --- */}
                                <li className="px-4 py-2 font-bold text-gray-500">Products</li>
                                {productLinks.map(link => (
                                     <li key={link.href} className="pl-4">
                                         <Link href={link.href} className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                             {link.name}
                                         </Link>
                                     </li>
                                ))}
                                <div className="my-2 border-t border-gray-700"></div> 
                                {/* --- END: Mobile Products Section --- */}
                                <li>
                                    <Link href="/products" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Products
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/personalized-gifts" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Gift Ideas
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/community" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Community
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/blog" className={`block px-4 py-2 ${forceLight ? "text-slate-800 hover:bg-gray-100" : "dark:text-white hover:bg-gray-700"}`} onClick={() => setIsMobileMenuOpen(false)}>
                                        Blog
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
