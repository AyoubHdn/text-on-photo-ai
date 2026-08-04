import Link from "next/link";

import {
  LegalSection,
  legalLinkClassName,
  legalListClassName,
  PagePosterLegalPage,
} from "~/component/PagePosterLegalPage";

const retentionItems = [
  {
    data: "Raw webhook and comment events, including n8n execution data",
    period: "Up to 30 days",
  },
  {
    data: "Comment IDs and deduplication or status records in Google Sheets",
    period: "Up to 30 days after processing",
  },
  {
    data: "Generated PagePoster images and image URLs in AWS S3",
    period: "Up to 30 days after generation",
  },
  {
    data: "Messenger event information processed by PagePoster",
    period: "Up to 30 days",
  },
  {
    data: "Application and security logs needed for abuse prevention or incident investigation",
    period: "Up to 90 days",
  },
];

const PagePosterPrivacy: React.FC = () => {
  return (
    <PagePosterLegalPage
      title="PagePoster Privacy Policy"
      metaTitle="PagePoster Privacy Policy | Name Design AI"
      description="Learn how HDN STUDIO LTD processes Meta Platform data through the PagePoster Facebook integration."
      path="/pageposter/privacy"
      summary="This policy explains how HDN STUDIO LTD handles Meta Platform data through PagePoster, an internal integration used with NameDesignAI and related Facebook Pages."
    >
      <LegalSection id="scope" title="Who we are and what this policy covers">
        <p>
          PagePoster is operated by <strong>HDN STUDIO LTD</strong>. It receives
          eligible comment events on posts made by a Facebook Page, processes a
          requested name, generates name art, and can send a permitted private
          reply through Facebook Messenger.
        </p>
        <p>
          This policy applies to information processed by PagePoster.
          Meta/Facebook separately controls information on its platforms under
          its own terms and privacy practices. For the broader Name Design AI
          website, please also review the{" "}
          <Link href="/privacy-policy" className={legalLinkClassName}>
            Name Design AI Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="data" title="Meta Platform data PagePoster may process">
        <p>
          Depending on the event and available Meta fields, PagePoster may
          process:
        </p>
        <ul className={legalListClassName}>
          <li>Facebook Page identifiers.</li>
          <li>Group, post, and comment identifiers.</li>
          <li>Commenter display name and identifiers supplied by Meta.</li>
          <li>Comment text, including the name requested by the commenter.</li>
          <li>
            Messenger identifiers and message events when a permitted private
            reply is used.
          </li>
          <li>Generated-art requests and the URLs of resulting images.</li>
          <li>
            Security, delivery, and diagnostic logs necessary to operate and
            protect the integration.
          </li>
        </ul>
        <p>
          PagePoster also uses Page access tokens and related credentials to
          perform authorized operations for connected Pages. These are
          confidential operational credentials, are not sold, and are retained
          only while the relevant Page remains connected or while they are
          otherwise needed to operate the integration.
        </p>
      </LegalSection>

      <LegalSection
        id="purposes"
        title="Why PagePoster processes this information"
      >
        <p>PagePoster processes the information described above to:</p>
        <ul className={legalListClassName}>
          <li>Detect eligible comments on Page-owned posts.</li>
          <li>Extract the name a user requested.</li>
          <li>Generate the requested name art.</li>
          <li>Deliver permitted replies through Facebook Messenger.</li>
          <li>Prevent duplicate processing, abuse, and security incidents.</li>
          <li>Maintain, monitor, and troubleshoot the integration.</li>
        </ul>
      </LegalSection>

      <LegalSection id="providers" title="How data moves through PagePoster">
        <p>
          PagePoster uses the following providers for the stated operational
          purposes:
        </p>
        <ul className={legalListClassName}>
          <li>
            <strong>Meta/Facebook</strong> supplies eligible Page, post,
            comment, and Messenger events and delivers permitted private
            replies.
          </li>
          <li>
            <strong>Self-hosted n8n on AWS EC2</strong> orchestrates the
            workflow and temporarily processes events.
          </li>
          <li>
            <strong>Google Sheets</strong> holds Page and post configuration,
            workflow status, and deduplication records.
          </li>
          <li>
            <strong>AWS S3</strong> stores generated name-art images and their
            URLs.
          </li>
          <li>
            <strong>Replicate</strong> performs AI image generation.
          </li>
        </ul>
        <p>
          PagePoster sends Replicate only the requested name or relevant comment
          text and the generation instructions needed to create the artwork. It
          does not send Facebook access tokens, Page tokens, Facebook or
          commenter identifiers, post IDs, or unrelated webhook metadata to
          Replicate. AWS S3 is used for generated images, not for Facebook
          access tokens or complete webhook payloads.
        </p>
      </LegalSection>

      <LegalSection id="restricted-use" title="No sale or unrelated use">
        <p>
          HDN STUDIO LTD does not sell Meta Platform data processed by
          PagePoster. PagePoster does not use that data for unrelated
          advertising, profiling, surveillance, or decisions about a
          person&apos;s eligibility for employment, housing, credit, insurance,
          education, or similar opportunities.
        </p>
        <p>
          Page access tokens and other credentials are used only for authorized
          operational tasks and are treated as confidential. They are not
          included in AI-generation prompts or image storage.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="Retention and deletion">
        <p>
          HDN STUDIO LTD has adopted the following maximum retention periods for
          PagePoster data. Data may be removed sooner when it is no longer
          needed or when a valid deletion request applies.
        </p>
        <dl className="overflow-hidden rounded-xl border border-slate-200">
          {retentionItems.map((item) => (
            <div
              key={item.data}
              className="grid gap-1 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-6"
            >
              <dt className="font-medium text-slate-800">{item.data}</dt>
              <dd className="font-semibold text-brand-800 sm:text-right">
                {item.period}
              </dd>
            </div>
          ))}
        </dl>
        <p>
          Page access tokens are retained only while the relevant Page remains
          connected to PagePoster. They are revoked or deleted when the
          integration is disconnected or no longer needed. Backups containing
          deleted PagePoster data are removed through normal backup rotation
          within a maximum additional 30 days.
        </p>
        <p>
          HDN STUDIO LTD may retain narrowly limited records when reasonably
          required for security, fraud prevention, legal compliance, or to
          establish that a deletion request was completed.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="Your choices and privacy rights">
        <p>
          Depending on where you live, you may have rights concerning personal
          information that PagePoster controls, such as requesting access,
          correction, deletion, restriction, or a copy of certain information.
          Rights can vary by location and circumstances. HDN STUDIO LTD may
          request reasonable verification before acting on a request.
        </p>
        <p>
          To request deletion, follow the{" "}
          <Link href="/pageposter/data-deletion" className={legalLinkClassName}>
            PagePoster Data Deletion Instructions
          </Link>
          . Other privacy questions or requests can be sent to{" "}
          <a
            href="mailto:support@namedesignai.com"
            className={legalLinkClassName}
          >
            support@namedesignai.com
          </a>
          .
        </p>
        <p>
          Deleting information from PagePoster does not automatically delete
          information retained independently by Meta/Facebook. This includes an
          original Facebook comment or post, Messenger records retained by Meta,
          and information in a Facebook account. Use Facebook&apos;s own
          controls for that information.
        </p>
      </LegalSection>

      <LegalSection id="international" title="International data processing">
        <p>
          PagePoster&apos;s providers may process information in countries other
          than the country where you live. HDN STUDIO LTD uses measures designed
          to protect PagePoster data during this processing, including limiting
          the data sent to each provider and applying access restrictions
          appropriate to the provider&apos;s role.
        </p>
      </LegalSection>

      <LegalSection id="security" title="Security practices">
        <p>
          PagePoster is designed to limit collection and provider disclosures to
          what the workflow needs. Access tokens and credentials are treated as
          confidential, provider payloads are minimized, and operational access
          is limited to those who need it to run or secure the integration.
          Retention limits and diagnostic logging are intended to reduce risk
          and support incident investigation.
        </p>
        <p>
          No system or transmission method is completely secure. If you believe
          your interaction with PagePoster may be involved in a security issue,
          contact us promptly.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children’s privacy">
        <p>
          PagePoster is not directed to children. If you believe a child&apos;s
          information was processed through PagePoster, contact us so we can
          review and, where appropriate, delete the information we control.
        </p>
      </LegalSection>

      <LegalSection id="updates" title="Policy updates">
        <p>
          HDN STUDIO LTD may update this policy when PagePoster&apos;s
          operation, providers, or data practices change. The effective date at
          the top of this page will be updated when a revised policy is
          published. Material changes may also be communicated through an
          appropriate Name Design AI or Facebook Page channel.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact us">
        <p>
          For questions about PagePoster or this policy, contact HDN STUDIO LTD
          at{" "}
          <a
            href="mailto:support@namedesignai.com"
            className={legalLinkClassName}
          >
            support@namedesignai.com
          </a>
          .
        </p>
      </LegalSection>
    </PagePosterLegalPage>
  );
};

export default PagePosterPrivacy;
