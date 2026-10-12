import {
  authFinalizeNewUserFromService,
  authFinalizeSignInFromService,
  type AuthEventSyncState,
} from "~/server/cloudflare/dbService";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import {
  MAUTIC_FIRST_DIGITAL_ART_INTEREST_ALIAS,
  MAUTIC_LATEST_DIGITAL_ART_INTEREST_ALIAS,
  type DigitalArtInterest,
} from "~/server/mautic/digitalArtInterest";

export type AuthEventUser = {
  id: string;
  email: string | null;
  name?: string | null;
};

export type AuthEventDetection = {
  isPaid: boolean;
  sourcePage?: string;
  promotedProduct?: string;
};

export type AuthEventDependencies = {
  updateMauticContact: typeof updateMauticContact;
};

export type AuthEventResult =
  | { found: true; syncState: AuthEventSyncState }
  | { found: false };

export function shouldUseServiceAuthBackend(): boolean {
  return process.env.DB_AUTH_BACKEND === "service";
}

const defaultDependencies: AuthEventDependencies = {
  updateMauticContact,
};

const suppressedExternalSyncDependencies: AuthEventDependencies = {
  updateMauticContact: async () => {
    console.log("AUTH_TEST external sync suppressed");
  },
};

/**
 * Select the external-sync dependency for service-backed auth events.
 *
 * The no-op mode is intentionally gated by both the service backend and an
 * explicit test-only setting. Node/Vercel and the legacy event path always
 * retain the real Mautic dependency.
 */
export function getAuthEventDependencies(): AuthEventDependencies {
  if (
    shouldUseServiceAuthBackend() &&
    process.env.AUTH_EXTERNAL_SYNC_MODE === "noop"
  ) {
    return suppressedExternalSyncDependencies;
  }
  return defaultDependencies;
}

function creditsForMautic(value: string): string {
  // The existing Mautic helper accepts a string and applies its existing
  // Decimal formatting/preview-balance rules without losing precision.
  return value;
}

function generalPayload(
  state: AuthEventSyncState,
  detection: AuthEventDetection,
) {
  return {
    email: state.email!,
    name: state.name,
    brand_specific_credits: creditsForMautic(state.credits),
    brand_specific_plan: state.plan,
    customFields: {
      is_paid_traffic_user: state.paidTrafficUser ? 1 : 0,
      has_generated_design: state.hasGeneratedDesign ? 1 : 0,
      has_visited_checkout: state.hasVisitedCheckout ? 1 : 0,
      paid_traffic_source_page: detection.sourcePage,
      paid_traffic_promoted_pro: detection.promotedProduct,
    },
  };
}

async function sendInterestSync(
  state: AuthEventSyncState,
  interest: DigitalArtInterest,
  dependencies: AuthEventDependencies,
): Promise<void> {
  if (!state.email) return;

  try {
    await dependencies.updateMauticContact(
      {
        email: state.email,
        name: state.name,
        brand_specific_credits: creditsForMautic(state.credits),
        customFields: {
          [MAUTIC_FIRST_DIGITAL_ART_INTEREST_ALIAS]:
            state.firstDigitalArtInterest ?? interest,
          [MAUTIC_LATEST_DIGITAL_ART_INTEREST_ALIAS]:
            state.latestDigitalArtInterest ?? interest,
        },
      },
      "namedesignai",
    );
  } catch (error) {
    // Match recordDigitalArtInterest: the DB state is authoritative and an
    // interest-specific Mautic failure must not abort authentication.
    console.error("Failed to sync digital art interest:", error);
  }
}

async function runServiceEvent(params: {
  kind: "signIn" | "createUser";
  user: AuthEventUser;
  detection: AuthEventDetection;
  interest: DigitalArtInterest | null;
  dependencies: AuthEventDependencies;
}): Promise<AuthEventResult> {
  if (!params.user.email) return { found: false };

  const finalize =
    params.kind === "signIn"
      ? authFinalizeSignInFromService
      : authFinalizeNewUserFromService;

  // Preserve legacy ordering: paid-traffic state is finalized before the
  // general Mautic call, while interest is finalized only afterward.
  const first = await finalize({
    userId: params.user.id,
    markPaidTraffic: params.detection.isPaid,
    digitalArtInterest: null,
  });
  if (!first.found) {
    console.error(`User not found in database on ${params.kind}.`);
    return first;
  }

  await params.dependencies.updateMauticContact(
    generalPayload(first.syncState, params.detection),
    "namedesignai",
  );

  if (!params.interest) return first;

  const second = await finalize({
    userId: params.user.id,
    markPaidTraffic: false,
    digitalArtInterest: params.interest,
  });
  if (!second.found) {
    console.error(`User disappeared during ${params.kind} interest sync.`);
    return second;
  }

  await sendInterestSync(second.syncState, params.interest, params.dependencies);
  return second;
}

export function runAuthSignInEvent(params: {
  user: AuthEventUser;
  detection: AuthEventDetection;
  interest: DigitalArtInterest | null;
  dependencies?: AuthEventDependencies;
}): Promise<AuthEventResult> {
  return runServiceEvent({
    ...params,
    kind: "signIn",
    dependencies: params.dependencies ?? getAuthEventDependencies(),
  });
}

export function runAuthCreateUserEvent(params: {
  user: AuthEventUser;
  detection: AuthEventDetection;
  interest: DigitalArtInterest | null;
  dependencies?: AuthEventDependencies;
}): Promise<AuthEventResult> {
  return runServiceEvent({
    ...params,
    kind: "createUser",
    dependencies: params.dependencies ?? getAuthEventDependencies(),
  });
}
