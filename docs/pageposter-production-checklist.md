# PagePoster production privacy enforcement checklist

Complete and verify every item before submitting the PagePoster legal URLs to Meta. The public
policy states maximum retention periods; publishing it does not configure these controls.

## Data-flow validation

- [ ] Capture a representative Meta webhook in a non-production test and document every field that
      enters n8n, Google Sheets, Replicate, and AWS S3.
- [ ] Confirm Replicate receives only the requested name or relevant comment text plus generation
      instructions. Block Facebook and commenter identifiers, Page or access tokens, post IDs, and
      unrelated webhook metadata from the Replicate node.
- [ ] Confirm the S3 upload contains only generated image objects and does not contain credentials or
      complete webhook payloads in object bodies, keys, tags, or metadata.
- [ ] Confirm Google Sheets contains only Page/post configuration and the minimum workflow status,
      timestamp, and comment ID needed for deduplication.

## n8n and raw events — 30 days maximum

- [ ] Enable n8n execution-data pruning with a retention setting of no more than 30 days on the AWS
      EC2 deployment.
- [ ] Include successful, failed, waiting, and manually stopped executions, plus binary execution
      data, in the pruning policy.
- [ ] Check n8n application logs, reverse-proxy logs, EC2 user data, temporary files, and attached
      volumes for copied webhook bodies. Remove or separately expire every copy within 30 days.
- [ ] Run a test event, advance or simulate the retention window, and verify that neither the n8n UI
      nor its database or filesystem can retrieve the payload afterward.

## Google Sheets deduplication and status — 30 days after processing

- [ ] Store a reliable `processed_at` timestamp on every comment/status row.
- [ ] Add a scheduled cleanup workflow that permanently removes rows no later than 30 days after
      processing, and alert on cleanup failures.
- [ ] Verify that formulas, copied tabs, exports, Apps Script logs, and connected tools do not create
      unexpired duplicates.
- [ ] Validate Google Sheets revision-history and Google Workspace backup behavior. If deleted rows
      cannot be removed through normal rotation within the additional 30-day backup limit, move
      deduplication data to a store with enforceable retention before launch.

## AWS S3 generated images — 30 days after generation

- [ ] Use a dedicated PagePoster bucket or prefix so the lifecycle rule cannot affect unrelated Name
      Design AI images.
- [ ] Apply and verify an S3 lifecycle expiration rule that deletes PagePoster image objects no later
      than 30 days after creation.
- [ ] If versioning is enabled, expire noncurrent versions and delete markers within the permitted
      backup-rotation window. Abort incomplete multipart uploads promptly.
- [ ] Confirm image URLs are removed from Google Sheets, n8n data, messages queued by PagePoster, and
      any other active index when the corresponding image is deleted.
- [ ] Test the lifecycle rule on a non-production object and verify the object and every version are
      no longer retrievable.

## Messenger data and application/security logs

- [ ] Inventory every location where Messenger identifiers or events are recorded and apply a
      maximum 30-day retention rule.
- [ ] Configure application, reverse-proxy, AWS, monitoring, and security-log retention to no more
      than 90 days.
- [ ] Redact access tokens, credentials, full webhook bodies, and unnecessary comment or Messenger
      content from logs before storage.

## Page access tokens and credentials

- [ ] Keep Page access tokens in an access-controlled secret store, not Google Sheets, S3, workflow
      exports, execution logs, or AI prompts.
- [ ] Implement and test a disconnect runbook that revokes or deletes the relevant Page token when a
      Page is disconnected or the integration no longer needs it.
- [ ] Audit access to n8n, EC2, Google Sheets, S3, and secrets, and remove accounts without an
      operational need.

## Deletion-request workflow

- [ ] Route `support@namedesignai.com` requests with the subject “PagePoster data deletion request”
      to an accountable owner and track the 7-day acknowledgement deadline.
- [ ] Create a verification procedure that uses interaction details and never requests passwords,
      access tokens, or excessive personal data.
- [ ] Create a deletion runbook covering n8n executions/raw events, Google Sheets rows, Messenger
      event records, S3 objects and versions, generated-art requests, delivery records, and logs that
      can be associated with the requester.
- [ ] Track the 30-day post-verification active-system deadline and record only the minimum evidence
      needed to show the request was completed.
- [ ] Use a response template that distinguishes PagePoster-controlled data from posts, comments,
      Messenger records, and account data independently controlled by Meta/Facebook.

## Backups — additional 30 days maximum

- [ ] Inventory EC2/EBS snapshots, n8n database backups, S3 versions or replicas, Google Workspace
      backups, log archives, and any third-party backup system containing PagePoster data.
- [ ] Configure backup expiration so deleted PagePoster data disappears through normal rotation
      within an additional maximum of 30 days.
- [ ] Test restoration from the oldest retained backup and confirm no PagePoster data survives beyond
      the published limit.

## Launch evidence

- [ ] Record configuration screenshots or exports, owners, review dates, and test results for every
      retention and deletion control without exposing live credentials.
- [ ] Test both public routes without authentication on mobile and desktop:
      `/pageposter/privacy` and `/pageposter/data-deletion`.
- [ ] Re-review the public policy whenever providers, fields, workflow purposes, or retention
      practices change.
