import Link from "next/link";

// Make sure the function name is different from the file path name 
// to avoid internal naming conflicts in Next.js
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-slate-800 leading-relaxed">
      <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-10 font-mono">
        Last Updated: December 23, 2025
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">1. Information Usage</h2>
        <p>
          We use your email and assessment responses solely to generate your Persona Drive report. 
          Payments are handled securely via Lemon Squeezy.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">2. Data Rights</h2>
        <p>
          To request data deletion, contact support@persona-drive-secrets.com.
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