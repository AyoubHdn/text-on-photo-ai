import Link from "next/link";

import {
  LegalSection,
  legalLinkClassName,
  legalListClassName,
  PagePosterLegalPage,
} from "~/component/PagePosterLegalPage";

const PagePosterDataDeletion: React.FC = () => {
  return (
    <PagePosterLegalPage
      title="PagePoster Data Deletion Instructions"
      metaTitle="PagePoster Data Deletion Instructions | Name Design AI"
      description="Request deletion of data processed by the PagePoster Meta and Facebook integration operated by HDN STUDIO LTD."
      path="/pageposter/data-deletion"
      summary="Use these instructions to ask HDN STUDIO LTD to locate and delete information controlled by the PagePoster Meta integration."
    >
      <LegalSection id="request" title="How to submit a deletion request">
        <p>
          Email{" "}
          <a
            href="mailto:support@namedesignai.com?subject=PagePoster%20data%20deletion%20request"
            className={legalLinkClassName}
          >
            support@namedesignai.com
          </a>{" "}
          with the subject <strong>PagePoster data deletion request</strong>.
        </p>
        <p>
          Provide only enough information to help us locate the relevant
          PagePoster interaction. Useful details may include:
        </p>
        <ul className={legalListClassName}>
          <li>Your Facebook display name.</li>
          <li>The relevant Facebook Page, post, or comment URL or ID.</li>
          <li>The approximate date of the interaction.</li>
          <li>Any PagePoster-generated image URL you received.</li>
        </ul>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="font-semibold">Never send credentials.</p>
          <p className="mt-1">
            Do not include your Facebook password, a Page access token, or any
            other password, token, or login credential. HDN STUDIO LTD does not
            need those credentials to process a deletion request.
          </p>
        </div>
      </LegalSection>

      <LegalSection id="verification" title="Request verification">
        <p>
          HDN STUDIO LTD may ask for reasonable additional information to
          confirm that the requester is connected to the relevant interaction
          and to avoid deleting another person&apos;s data. Verification will be
          limited to what is reasonably necessary to locate and validate the
          request. We will not ask for a Facebook password or access token.
        </p>
        <p>
          If the information provided is not enough to locate a PagePoster
          record, we may explain what additional interaction detail is needed.
        </p>
      </LegalSection>

      <LegalSection id="deleted-data" title="Information PagePoster may delete">
        <p>
          After successful verification, HDN STUDIO LTD will delete located
          records controlled by PagePoster that are associated with the request,
          which may include:
        </p>
        <ul className={legalListClassName}>
          <li>Raw webhook, comment, and temporary n8n execution data.</li>
          <li>Comment IDs and deduplication or workflow-status records.</li>
          <li>Messenger event records processed by PagePoster.</li>
          <li>
            Generated-art requests that can be associated with the interaction.
          </li>
          <li>PagePoster-generated images and image URLs stored in AWS S3.</li>
          <li>Related delivery or diagnostic records that can be located.</li>
        </ul>
      </LegalSection>

      <LegalSection id="timeframe" title="Response and deletion timeframe">
        <ul className={legalListClassName}>
          <li>We will acknowledge the request within 7 calendar days.</li>
          <li>
            We will complete deletion from active PagePoster systems within 30
            calendar days after successful verification.
          </li>
          <li>
            Deleted PagePoster data in backups will be removed through normal
            backup rotation within an additional maximum of 30 days.
          </li>
        </ul>
        <p>
          HDN STUDIO LTD may retain narrowly limited records when reasonably
          required for security, fraud prevention, legal compliance, or to
          establish that a deletion request was completed.
        </p>
      </LegalSection>

      <LegalSection
        id="meta-data"
        title="Information controlled by Meta/Facebook"
      >
        <p>
          PagePoster cannot delete information that Meta/Facebook independently
          controls. This can include the original Group comment, Facebook post,
          Messenger records retained by Meta, and information you maintain in
          your Facebook account. Use Facebook&apos;s own account, post, comment,
          Page, Group, and Messenger controls to manage that information.
        </p>
        <p>
          Deleting PagePoster&apos;s copy of information or a generated image
          does not automatically delete the corresponding information from
          Meta/Facebook or from another platform where you or someone else
          shared it.
        </p>
      </LegalSection>

      <LegalSection id="privacy-policy" title="More information">
        <p>
          Read the{" "}
          <Link href="/pageposter/privacy" className={legalLinkClassName}>
            PagePoster Privacy Policy
          </Link>{" "}
          for details about the information PagePoster processes, why it is
          used, service providers, retention limits, and privacy choices.
        </p>
        <p>
          Questions about these instructions can be sent to{" "}
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

export default PagePosterDataDeletion;
