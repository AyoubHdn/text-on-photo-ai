import Link from "next/link";
import { PrimaryLink } from "./PrimaryLink";

export function Footer() {
  return (
    <footer className="bg-gray-300 dark:bg-gray-900 pb-24 ">
      <div className="container mx-auto flex flex-col justify-between gap-4 px-2 pt-8 text-center md:flex-row">
        <div className="flex flex-col gap-2">
          <PrimaryLink href="/">NameDesignAi.com</PrimaryLink><br/>
          <Link target="_blank" href="https://hdnstudio.com/">HDN STUDIO LTD</Link>
        </div>
        <div className="flex justify-between gap-8 px-4">
          <PrimaryLink href="/privacy-policy">Privacy Policy</PrimaryLink>
          <PrimaryLink href="/terms-of-service">Terms of Service</PrimaryLink>
          <PrimaryLink href="/refund">Refund Policy</PrimaryLink>
        </div>
        
      </div>
    </footer>
  );
}