import Link from "next/link";
import { PrimaryLink } from "./PrimaryLink";

export function Footer() {
  return (
    <footer className="dark:bg-gray-900">
      <div className="container mx-auto grid h-24 grid-cols-4 items-center bg-gray-900 text-center">
        <div>
        <PrimaryLink href="/">NameDesignAi.com.com</PrimaryLink><br/>
        <Link target="_blank" href="https://hdnstudio.com/">HDN STUDIO LTD</Link>
        </div>
        <PrimaryLink href="/privacy-policy">Privacy Policy</PrimaryLink>
        <PrimaryLink href="/terms-of-service">Terms of Service</PrimaryLink>
        <PrimaryLink href="/refund">Refund Policy</PrimaryLink>
        
      </div>
    </footer>
  );
}