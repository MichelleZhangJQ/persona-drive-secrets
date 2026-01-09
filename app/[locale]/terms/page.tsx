import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-slate-800 leading-relaxed">
      <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-10 font-mono">Last Updated: December 23, 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">1. Digital Product Delivery</h2>
        <p>
          The "Persona Drive Sync" is a digital information product. Upon successful payment, 
          you will receive immediate access to your custom report.
        </p>
      </section>

      <section className="mb-8 border-l-4 border-rose-500 pl-4 bg-rose-50 py-2">
        <h2 className="text-xl font-bold mb-4 text-rose-700">2. No-Refund Policy</h2>
        <p className="font-medium">
          Due to the nature of digital products, all sales are final. 
          Once the report has been generated or accessed, we cannot offer a refund.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">3. Contact</h2>
        <p>Questions? support@persona-drive-secrets.com</p>
      </section>

      {/* BACK BUTTON */}
      <Link 
        href="/" 
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 rounded-full text-sm font-bold hover:bg-slate-50 transition-colors"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}