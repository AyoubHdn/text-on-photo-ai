import Head from "next/head";

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy - Name Design AI</title>
        <meta
          name="description"
          content="Read our Privacy Policy at Name Design AI to understand how we handle your data."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center py-10">
        <div className="w-full max-w-4xl px-6">
          <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>
          <p className="text-sm  text-center mb-12">
            Last updated: <strong>December 30, 2024</strong>
          </p>
          <div className="prose prose-lg mx-auto  space-y-8">
            <p>
              This <strong>Privacy Policy</strong> describes Our policies and procedures on the
              collection, use, and disclosure of Your information when You use the Service and
              tells You about Your privacy rights and how the law protects You.
            </p>
            <p>
              We use Your Personal Data to provide and improve the Service. By using the Service,
              You agree to the collection and use of information in accordance with this Privacy
              Policy.
            </p>

            <h2 className="text-2xl font-bold mt-10">Interpretation and Definitions</h2>
            
            <h3 className="text-xl font-bold mt-6">Interpretation</h3>
            <p>
              The words with the initial letter capitalized have meanings defined under the
              following conditions. The following definitions shall have the same meaning
              regardless of whether they appear in singular or plural.
            </p>

            <h3 className="text-xl font-bold mt-6">Definitions</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Account</strong>: A unique account created for You to access our Service or
                parts of our Service.
              </li>
              <li>
                <strong>Affiliate</strong>: An entity that controls, is controlled by, or is under
                common control with a party, where &quot;control&quot; means ownership of 50% or more of the
                shares, equity interest, or other securities entitled to vote for election of
                directors or other managing authority.
              </li>
              <li>
                <strong>Company</strong>: (referred to as either &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot;, or
                &quot;Our&quot; in this Agreement) refers to HDN STUDIO LTD, 71-75 Shelton Street, Covent
                Garden, London, WC2H 9JQ.
              </li>
              <li>
                <strong>Cookies</strong>: Small files placed on Your computer, mobile device, or
                any other device by a website, containing the details of Your browsing history on
                that website among its many uses.
              </li>
              <li>
                <strong>Country</strong>: Refers to the United Kingdom.
              </li>
              <li>
                <strong>Device</strong>: Any device that can access the Service, such as a
                computer, cellphone, or digital tablet.
              </li>
              <li>
                <strong>Personal Data</strong>: Any information that relates to an identified or
                identifiable individual.
              </li>
              <li>
                <strong>Service</strong>: Refers to the Website.
              </li>
              <li>
                <strong>Service Provider</strong>: Any natural or legal person who processes the
                data on behalf of the Company.
              </li>
              <li>
                <strong>Website</strong>: Refers to Name Design AI, accessible from{" "}
                <a
                  href="https://www.namedesignai.com"
                  className="dark:text-gray-200 underline"
                  target="_blank"
                >
                  www.namedesignai.com
                </a>
              </li>
              <li>
                <strong>You</strong>: The individual accessing or using the Service, or the company
                or other legal entity on behalf of which such individual is accessing or using the
                Service, as applicable.
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-10">Collecting and Using Your Personal Data</h2>
            
            <h3 className="text-xl font-bold mt-6">Types of Data Collected</h3>
            
            <h4 className="font-bold mt-4">Personal Data</h4>
            <p>
              While using Our Service, We may ask You to provide Us with certain personally
              identifiable information that can be used to contact or identify You. Personally
              identifiable information may include, but is not limited to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Email address</li>
              <li>First name and last name</li>
              <li>Usage Data</li>
            </ul>

            <h4 className="font-bold mt-4">Usage Data</h4>
            <p>
              Usage Data is collected automatically when using the Service. This may include
              information such as Your Device&apos;s Internet Protocol address (e.g., IP address),
              browser type, browser version, the pages of our Service that You visit, the time and
              date of Your visit, and the time spent on those pages.
            </p>

            <h2 className="text-2xl font-bold mt-10">Use of Your Personal Data</h2>
            <p>
              The Company may use Personal Data for the following purposes:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To manage Your Account</li>
              <li>To contact You for updates, offers, or security notifications</li>
              <li>To analyze and improve the effectiveness of our Service and marketing campaigns</li>
            </ul>

            <h2 className="text-2xl font-bold mt-10">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, You can contact us:
            </p>
            <p>
              **By email**:{" "}
              <a
                href="mailto:contact@namedesignai.com"
                className="dark:text-gray-200 underline"
              >
                contact@namedesignai.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;
