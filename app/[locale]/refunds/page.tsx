import Link from "next/link";

export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-slate-800 leading-relaxed">
      <h1 className="text-4xl font-black mb-8">Refund Policy</h1>
      <p className="text-sm text-slate-500 mb-10 font-mono">
        Last Updated: December 23, 2025
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-rose-600">Digital Product Disclosure</h2>
        <p className="mb-4">
          The Persona Drive Sync is a <strong>digital information product</strong> delivered 
          instantly to your dashboard and email. By completing your purchase of $3.99, 
          you explicitly agree that the digital content is provided immediately and the 
          contract is fully performed.
        </p>
      </section>

      <section className="mb-8 bg-slate-50 border border-slate-200 p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">No-Refund Policy</h2>
        <p className="mb-4">
          Due to the nature of digital data and the immediate delivery of results, 
          <strong> all sales are final.</strong> We do not offer refunds once the 
          Persona Drive Sync report has been generated for your account.
        </p>
        <p>
          This policy is in place because the value of the product (the personality 
          insights and data sync) is consumed the moment it is accessed.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Exceptions & Technical Issues</h2>
        <p className="mb-4">
          While we do not offer refunds for "change of mind," we are committed to your 
          satisfaction. If you experience any of the following, please contact us:
        </p>
        <ul className="list-disc ml-6 space-y-2 mb-6">
          <li>Payment was successful but the report failed to unlock.</li>
          <li>The generated report is blank or contains technical errors.</li>
          <li>Duplicate charges occurred by accident.</li>
        </ul>
        <p>
          Contact our support team at: 
          <span className="font-bold text-rose-600 ml-1 underline">
            support@persona-drive-secrets.com
          </span>
        </p>
      </section>

      {/* BACK BUTTON */}
      <Link 
        href="/" 
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 rounded-full text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}