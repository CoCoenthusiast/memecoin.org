export const metadata = {
  title: "Donations · memecoins.org",
}

export default function DonationsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Donations</h1>

      <p className="text-gray-200 mb-4">
        Donations to memecoins.org are completely optional. There&apos;s no benefit
        attached to them — no special access, no premium features, and no say in
        how the project is run.
      </p>

      <p className="text-gray-200 mb-4">
        Sending a donation is not an investment. It doesn&apos;t mean you own a piece
        of the site, and there&apos;s nothing to pay back. Once a donation is sent, it
        can&apos;t be refunded.
      </p>

      <p className="text-gray-200">
        If that all sounds fine and you still want to support the project, thank
        you — it genuinely helps.
      </p>
    </div>
  )
}
