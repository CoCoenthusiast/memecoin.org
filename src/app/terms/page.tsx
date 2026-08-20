export const metadata = {
  title: "Terms of Use · degenscult",
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Terms of Use</h1>
      <p className="text-gray-200 mb-6">
        By using degenscult, you agree to the following terms.
      </p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">1. Your account</h2>
        <p className="text-gray-200">
          You are responsible for keeping your password confidential and for all activity carried out through your account.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">2. Expected conduct</h2>
        <p className="text-gray-200">
          You must not: post spam, scams or misleading content about tokens; harass other users; impersonate someone else; or use the forum for illegal activities.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">3. User-published content</h2>
        <p className="text-gray-200">
          You are solely responsible for the content you publish. degenscult does not verify, endorse, or take responsibility for the accuracy of information posted by users.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">4. Moderation</h2>
        <p className="text-gray-200">
          We reserve the right to remove content or suspend accounts that violate these terms, at our discretion.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">5. No warranties</h2>
        <p className="text-gray-200">
          The site is provided &quot;as is&quot;, without warranties of continuous availability or freedom from errors.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">6. Changes</h2>
        <p className="text-gray-200">
          These terms may be updated at any time. Continued use of the site after changes constitutes acceptance of the new terms.
        </p>
      </section>

      <p className="text-gray-200">
        Questions: <a href="mailto:contato@degenscult" className="text-gray-400 hover:text-white transition-colors">contato@degenscult</a>
      </p>
    </div>
  )
}
