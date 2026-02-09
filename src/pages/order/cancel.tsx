/* eslint-disable @next/next/no-html-link-for-pages */
export default function OrderCancel() {
  return (
    <div className="max-w-xl mx-auto p-8 text-center bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-2">Payment was canceled</h1>
      <p className="text-muted-foreground mb-6">
        Your design is still saved. You can continue anytime.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/name-art-generator"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-secondary-foreground font-semibold hover:bg-blue-700 transition"
        >
          Return to your design
        </a>
        <a
          href="mailto:support@namedesignai.com"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-foreground hover:border-gray-400 transition"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
