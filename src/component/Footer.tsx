import Link from "next/link";
import { PrimaryLink } from "./PrimaryLink";
import { FaTwitter, FaPinterest, FaFacebook } from "react-icons/fa";


export function Footer() {

  // --- NEW: Generator pages to be listed in the footer ---
  const generatorLinks = [
    { href: "/personalized-gifts-generator", name: "Personalized Gift Generator" },
    { href: "/name-art-generator", name: "Name Art Generator" },
    { href: "/pro-logo-generator", name: "Pro Logo Generator" },
    { href: "/couples-name-art-generator", name: "Couples Name Art Generator" },
    { href: "/wedding-invitation-generator", name: "Wedding Invitation Generator" },
    { href: "/ai-portrait-generator", name: "AI Portrait Generator" },
    // TODO: Add more generator links here as you create them
    // { href: "/anniversary-art-generator", name: "Anniversary Art Generator" },
    // { href: "/gaming-logo-generator", name: "Gaming Logo Generator" },
  ];
  const socialLinks = [
    { href: "https://www.facebook.com/profile.php?id=61571453621496", name: "Facebook", icon: <FaFacebook size={24} /> },
    { href: "https://x.com/name_design_ai", name: "Twitter", icon: <FaTwitter size={24} /> },
    { href: "https://www.pinterest.com/namedesignai/", name: "Pinterest", icon: <FaPinterest size={24} /> },
    // TODO: Update these with your actual social media URLs
  ];

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg">NameDesignAi.com</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered art & logo creation for everyone.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} HDN STUDIO LTD
            </p>
            <div>
            <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
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
          

          {/* Column 2: Our Generators */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Our Generators</h3>
            <ul className="flex flex-col gap-3">
              {generatorLinks.map(link => (
                <li key={link.href}>
                  <PrimaryLink href={link.href} className="text-sm">
                    {link.name}
                  </PrimaryLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
             <h3 className="font-semibold text-lg mb-4">Explore</h3>
             <ul className="flex flex-col gap-3">
                <li><PrimaryLink href="/community" className="text-sm">Gallery</PrimaryLink></li>
                <li><PrimaryLink href="/buy-credits" className="text-sm">Pricing</PrimaryLink></li>
                <li><PrimaryLink href="/blog" className="text-sm">Blog</PrimaryLink></li>
             </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
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