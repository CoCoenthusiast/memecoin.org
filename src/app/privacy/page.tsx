export const metadata = {
  title: "Privacy Policy · degenscult",
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Privacy Policy</h1>
      <p className="text-gray-200 mb-6">
        This policy explains how we handle your data, in compliance with the LGPD (Lei Geral de Proteção de Dados, Brazil&apos;s data protection law).
      </p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">1. Data we collect</h2>
        <p className="text-gray-200">
          Username, email and password (stored encrypted, never in plain text). We also record the content you publish on the forum.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">2. What we use it for</h2>
        <p className="text-gray-200">
          To create and authenticate your account, display your posts and allow you to interact with other users.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">3. Sharing</h2>
        <p className="text-gray-200">
          We do not sell or share your personal data with third parties for marketing purposes.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">4. Cookies</h2>
        <p className="text-gray-200">
          We use a technical cookie to keep you signed in. We do not use advertising tracking cookies.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">5. Your rights</h2>
        <p className="text-gray-200">
          You may request access, correction or deletion of your data at any time by contacting us at the email below.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">6. Contact</h2>
        <p className="text-gray-200">
          <a href="mailto:contato@degenscult" className="text-gray-400 hover:text-white transition-colors">contato@degenscult</a>
        </p>
      </section>
    </div>
  )
}
