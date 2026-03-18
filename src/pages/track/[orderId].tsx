import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { prisma } from "~/server/db";

function resolveCarrierTrackingHome(carrier: string | null) {
  const normalized = carrier?.trim().toLowerCase() ?? "";
  if (normalized.includes("evri") || normalized.includes("hermes")) {
    return "https://www.evri.com/track-a-parcel";
  }
  return null;
}

export const getServerSideProps: GetServerSideProps<{
  orderId: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  carrierTrackingHome: string | null;
}> = async (context) => {
  const orderId = context.params?.orderId;
  if (typeof orderId !== "string" || !orderId.trim()) {
    return { notFound: true };
  }

  const order = await prisma.productOrder.findUnique({
    where: { id: orderId },
    include: { printfulOrder: true },
  });

  const directTrackingUrl = order?.printfulOrder?.trackingUrl?.trim();
  if (directTrackingUrl) {
    return {
      redirect: {
        destination: directTrackingUrl,
        permanent: false,
      },
    };
  }

  return {
    props: {
      orderId,
      trackingNumber: order?.printfulOrder?.trackingNumber ?? null,
      trackingCarrier: order?.printfulOrder?.trackingCarrier ?? null,
      carrierTrackingHome: resolveCarrierTrackingHome(order?.printfulOrder?.trackingCarrier ?? null),
    },
  };
};

export default function TrackingFallbackPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const hasTrackingNumber = Boolean(props.trackingNumber?.trim());

  return (
    <>
      <Head>
        <title>Track Order</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Order Tracking
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Tracking details</h1>
          <p className="mt-4 text-sm text-slate-600">
            Order ID: <span className="font-medium text-slate-900">{props.orderId}</span>
          </p>

          {hasTrackingNumber ? (
            <>
              <div className="mt-8 rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Tracking Number
                </p>
                <p className="mt-2 break-all text-lg font-semibold text-slate-900">
                  {props.trackingNumber}
                </p>
                {props.trackingCarrier ? (
                  <p className="mt-3 text-sm text-slate-600">
                    Carrier: <span className="font-medium text-slate-900">{props.trackingCarrier}</span>
                  </p>
                ) : null}
              </div>

              <p className="mt-6 text-sm text-slate-600">
                If the carrier site asks for your parcel number, copy the tracking number above and paste
                it there.
              </p>

              {props.carrierTrackingHome ? (
                <a
                  href={props.carrierTrackingHome}
                  className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Open carrier tracking
                </a>
              ) : null}
            </>
          ) : (
            <p className="mt-8 rounded-xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200">
              Tracking information is not available yet for this order.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

