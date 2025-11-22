import Link from "next/link";
import { PrimaryLink } from "./PrimaryLink";
import { FaTwitter, FaPinterest, FaFacebook } from "react-icons/fa";

export function Footer() {

  // Group 1: Text & Logo Based
  const textGenerators = [
    { href: "/name-art-generator", name: "Name Art Generator" },
    { href: "/arabic-name-art-generator", name: "Arabic Name Art Generator" },
    { href: "/couples-name-art-generator", name: "Couples Art Generator" },
    { href: "/pro-logo-generator", name: "Pro Logo Generator" },
  ];

  // Group 2: Photo & Event Based
  const photoGenerators = [
    { href: "/ai-portrait-generator", name: "AI Portrait Generator" },
    { href: "/baby-photoshoot-generator", name: "Baby Photoshoot Generator" },
    { href: "/wedding-invitation-generator", name: "Wedding Invitation Generator" },
  ];

  const socialLinks = [
    { href: "https://www.facebook.com/profile.php?id=61571453621496", name: "Facebook", icon: <FaFacebook size={24} /> },
    { href: "https://x.com/name_design_ai", name: "Twitter", icon: <FaTwitter size={24} /> },
    { href: "https://www.pinterest.com/namedesignai/", name: "Pinterest", icon: <FaPinterest size={24} /> },
  ];

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info & Socials */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg">NameDesignAi.com</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered art & logo creation for everyone.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} HDN STUDIO LTD
            </p>
            <div>
              <h3 className="font-semibold text-lg mb-4 mt-2">Follow Us</h3>
              <div className="flex gap-4">
                {socialLinks.map(social => (
                  <a 
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    aria-label={social.name}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          

          {/* Column 2: Name & Text Generators */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Name & Branding</h3>
            <ul className="flex flex-col gap-3">
              {textGenerators.map(link => (
                <li key={link.href}>
                  <PrimaryLink href={link.href} className="text-sm">
                    {link.name}
                  </PrimaryLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Photo & Event Generators */}
          <div>
             <h3 className="font-semibold text-lg mb-4">Photo & Occasions</h3>
             <ul className="flex flex-col gap-3">
                {photoGenerators.map(link => (
                  <li key={link.href}>
                    <PrimaryLink href={link.href} className="text-sm">
                      {link.name}
                    </PrimaryLink>
                  </li>
                ))}
             </ul>
          </div>

          {/* Column 4: Company & Legal (Merged for better space) */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="flex flex-col gap-3 mb-6">
              <li><PrimaryLink href="/community" className="text-sm">Gallery</PrimaryLink></li>
              <li><PrimaryLink href="/buy-credits" className="text-sm">Pricing</PrimaryLink></li>
              <li><PrimaryLink href="/blog" className="text-sm">Blog</PrimaryLink></li>
            </ul>

            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="flex flex-col gap-3">
              <li><PrimaryLink href="/privacy-policy" className="text-sm">Privacy Policy</PrimaryLink></li>
              <li><PrimaryLink href="/terms-of-service" className="text-sm">Terms of Service</PrimaryLink></li>
              <li><PrimaryLink href="/refund" className="text-sm">Refund Policy</PrimaryLink></li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
}