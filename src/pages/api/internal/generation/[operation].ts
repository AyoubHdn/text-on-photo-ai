import type { NextApiRequest, NextApiResponse } from "next";
import {
  generationClaimExecutionFromService,
  generationFinalizeFailureFromService,
  generationFinalizeSuccessFromService,
  generationSetPredictionIdFromService,
} from "~/server/cloudflare/dbService";
import { validateAsyncGenerationSuccessCallback } from "~/server/generation/asyncPayload";
import { syncAsyncGenerationMauticForUser } from "~/server/generation/asyncMautic";
import { acceptGenerationNonce, verifyGenerationRequest } from "~/server/generation/internalAuth";

export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = await rawBody(req);
  const secret = process.env.GENERATION_INTERNAL_HMAC_SECRET ?? "";
  const valid = await verifyGenerationRequest(
    {
      timestamp: req.headers["x-generation-timestamp"] as string | undefined,
      nonce: req.headers["x-generation-nonce"] as string | undefined,
      signature: req.headers["x-generation-signature"] as string | undefined,
    },
    body,
    secret,
  );
  if (!valid || !acceptGenerationNonce(String(req.headers["x-generation-nonce"] ?? ""))) {
    return res.status(401).json({ error: "Invalid generation signature" });
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  try {
    const operation = String(req.query.operation ?? "");
    let result;
    if (operation === "claim") {
      if (typeof input.generationRequestId !== "string" || typeof input.processingAttemptId !== "string" || !Number.isInteger(input.leaseSeconds)) return res.status(400).json({ error: "Invalid claim payload" });
      result = await generationClaimExecutionFromService({
        generationRequestId: input.generationRequestId,
        processingAttemptId: input.processingAttemptId,
        leaseSeconds: input.leaseSeconds as number,
      });
    } else if (operation === "prediction") {
      if (typeof input.generationRequestId !== "string" || typeof input.processingAttemptId !== "string" || typeof input.predictionId !== "string") return res.status(400).json({ error: "Invalid prediction payload" });
      result = await generationSetPredictionIdFromService({
        generationRequestId: input.generationRequestId,
        processingAttemptId: input.processingAttemptId,
        predictionId: input.predictionId,
      });
    } else if (operation === "callback" && input.status === "success") {
      const validation = validateAsyncGenerationSuccessCallback(input);
      if (!validation.ok) {
        console.warn("Invalid async success callback payload", { reasons: validation.reasons });
        return res.status(400).json({ error: "Invalid success callback payload" });
      }
      const callback = validation.value;
      result = await generationFinalizeSuccessFromService({
        generationRequestId: callback.generationRequestId,
        processingAttemptId: callback.processingAttemptId,
        predictionId: callback.predictionId,
        outputs: callback.outputs.map((output) => ({
          iconId: output.id,
          s3Key: output.id,
          imageUrl: output.url,
          prompt: callback.prompt,
          metadata: {
            ...callback.iconMetadata,
            contentType: output.contentType,
            ...(output.width === undefined ? {} : { width: output.width }),
            ...(output.height === undefined ? {} : { height: output.height }),
          },
        })),
        digitalArtInterest: callback.digitalArtInterest,
      });
      if ("job" in result) await syncAsyncGenerationMauticForUser(result.job.userId);
    } else if (operation === "callback" && input.status === "failure") {
      if (typeof input.generationRequestId !== "string" || typeof input.processingAttemptId !== "string") return res.status(400).json({ error: "Invalid failure callback payload" });
      result = await generationFinalizeFailureFromService({
        generationRequestId: input.generationRequestId,
        processingAttemptId: input.processingAttemptId,
        errorMessage: String(input.errorMessage ?? input.errorCode ?? "GENERATION_FAILURE"),
      });
      if ("job" in result) await syncAsyncGenerationMauticForUser(result.job.userId);
    } else {
      return res.status(404).json({ error: "Unknown operation" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error("Generation internal endpoint failed", error);
    return res.status(500).json({ error: "Generation internal operation failed" });
  }
}
