import type { NextApiRequest, NextApiResponse } from "next";
import { generationClaimExecutionFromService, generationFinalizeFailureFromService, generationFinalizeSuccessFromService, generationSetPredictionIdFromService } from "~/server/cloudflare/dbService";
import { acceptGenerationNonce, verifyGenerationRequest } from "~/server/generation/internalAuth";
export const config = { api: { bodyParser: false } };
async function rawBody(req: NextApiRequest): Promise<string> { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); return Buffer.concat(chunks).toString("utf8"); }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = await rawBody(req); const secret = process.env.GENERATION_INTERNAL_HMAC_SECRET ?? "";
  const valid = await verifyGenerationRequest({ timestamp: req.headers["x-generation-timestamp"] as string | undefined, nonce: req.headers["x-generation-nonce"] as string | undefined, signature: req.headers["x-generation-signature"] as string | undefined }, body, secret);
  if (!valid || !acceptGenerationNonce(String(req.headers["x-generation-nonce"] ?? ""))) return res.status(401).json({ error: "Invalid generation signature" });
  let input: Record<string, unknown>; try { input = JSON.parse(body) as Record<string, unknown>; } catch { return res.status(400).json({ error: "Invalid JSON" }); }
  try {
    const operation = String(req.query.operation ?? "");
    const result = operation === "claim" ? await generationClaimExecutionFromService(input as { generationRequestId: string; processingAttemptId: string; leaseSeconds: number }) : operation === "prediction" ? await generationSetPredictionIdFromService(input as { generationRequestId: string; processingAttemptId: string; predictionId: string }) : operation === "callback" ? input.status === "success" ? await generationFinalizeSuccessFromService({ generationRequestId: input.generationRequestId, processingAttemptId: input.processingAttemptId, predictionId: input.predictionId, outputs: Array.isArray(input.outputs) ? input.outputs.map((rawOutput) => { const output = rawOutput as Record<string, unknown>; return { iconId: output.id, s3Key: output.id, imageUrl: output.url, prompt: null, metadata: { contentType: output.contentType, width: output.width, height: output.height } }; }) : [], digitalArtInterest: input.digitalArtInterest }) : await generationFinalizeFailureFromService({ generationRequestId: input.generationRequestId as string, processingAttemptId: input.processingAttemptId as string, errorMessage: String(input.errorMessage ?? input.errorCode ?? "GENERATION_FAILURE") }) : null;
    if (!result) return res.status(404).json({ error: "Unknown operation" }); return res.status(200).json(result);
  } catch (error) { console.error("Generation internal endpoint failed", error); return res.status(500).json({ error: "Generation internal operation failed" }); }
}
