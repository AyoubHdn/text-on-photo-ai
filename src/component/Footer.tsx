import Link from "next/link";
import { FaFacebook, FaPinterest, FaTwitter } from "react-icons/fa";

import { PrimaryLink } from "./PrimaryLink";

type FooterProps = {
  minimal?: boolean;
  forceLight?: boolean;
};

export function Footer({ minimal = false, forceLight = false }: FooterProps) {
  if (minimal) {
    return (
      <footer
        className={`border-t border-gray-200 py-3 ${
          forceLight ? "bg-white" : "bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
        }`}
      >
        <div
          className={`container mx-auto px-6 text-center text-xs ${
            forceLight ? "text-gray-600" : "text-gray-600 dark:text-gray-300"
          }`}
        >
          Secure checkout • Printed in USA • Fast shipping
        </div>
      </footer>
    );
  }

  const textGenerators = [
    { href: "/name-art-generator", name: "Name Art Generator" },
    { href: "/arabic-name-art-generator", name: "Arabic Name Art Generator" },
    { href: "/couples-name-art-generator", name: "Couples Art Generator" },
  ];

  const giftLinks = [
    { href: "/products", name: "All Products" },
    { href: "/personalized-gifts", name: "Personalized Gifts" },
    { href: "/personalized-name-wall-art", name: "Name Wall Art" },
    { href: "/personalized-name-mugs", name: "Name Mugs" },
    { href: "/custom-name-shirts", name: "Name Shirts" },
    { href: "/couple-gifts", name: "Couple Gifts" },
    { href: "/arabic-name-gifts", name: "Arabic Name Gifts" },
  ];

  const socialLinks = [
    {
      href: "https://www.facebook.com/profile.php?id=61571453621496",
      name: "Facebook",
      icon: <FaFacebook size={24} />,
    },
    {
      href: "https://x.com/name_design_ai",
      name: "Twitter",
      icon: <FaTwitter size={24} />,
    },
    {
      href: "https://www.pinterest.com/namedesignai/",
      name: "Pinterest",
      icon: <FaPinterest size={24} />,
    },
  ];

  return (
    <footer
      className={`border-t border-gray-200 bg-gray-100 ${
        forceLight ? "" : "dark:border-gray-700 dark:bg-gray-900"
      }`}
    >
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">NameDesignAi.com</h3>
            <p
              className={`text-sm ${
                forceLight ? "text-gray-600" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              A personalized engine that turns identity into art and products.
            </p>
            <p
              className={`text-sm ${
                forceLight ? "text-gray-600" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              © {new Date().getFullYear()} HDN STUDIO LTD
            </p>
            <div>
              <h3 className="mb-4 mt-2 text-lg font-semibold">Follow Us</h3>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-500 transition-colors hover:text-blue-500 ${
                      forceLight ? "" : "dark:hover:text-blue-400"
                    }`}
                    aria-label={social.name}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Create</h3>
            <ul className="flex flex-col gap-3">
              {textGenerators.map((link) => (
                <li key={link.href}>
                  <PrimaryLink href={link.href} className="text-sm">
                    {link.name}
                  </PrimaryLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Gift Ideas</h3>
            <ul className="flex flex-col gap-3">
              {giftLinks.map((link) => (
                <li key={link.href}>
                  <PrimaryLink href={link.href} className="text-sm">
                    {link.name}
                  </PrimaryLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Company</h3>
            <ul className="mb-6 flex flex-col gap-3">
              <li>
                <PrimaryLink href="/community" className="text-sm">
                  Gallery
                </PrimaryLink>
              </li>
              <li>
                <PrimaryLink href="/blog" className="text-sm">
                  Blog
                </PrimaryLink>
              </li>
              <li>
                <PrimaryLink href="/buy-credits" className="text-sm">
                  Pricing
                </PrimaryLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Legal</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <PrimaryLink href="/privacy-policy" className="text-sm">
                  Privacy Policy
                </PrimaryLink>
              </li>
              <li>
                <PrimaryLink href="/terms-of-service" className="text-sm">
                  Terms of Service
                </PrimaryLink>
              </li>
              <li>
                <PrimaryLink href="/refund" className="text-sm">
                  Refund Policy
                </PrimaryLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
