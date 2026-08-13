export const metadata = {
  title: "Financial Disclaimer · memecoins.org",
}

export default function DisclaimerPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Financial Disclaimer</h1>
      <p className="text-gray-200 mb-4">
        Content published on memecoins.org by its users is strictly informational and does not constitute financial or investment advice, nor a recommendation to buy or sell any asset.
      </p>
      <p className="text-gray-200 mb-4">
        Trading cryptocurrencies and memecoins involves high risk, including the possibility of losing your entire invested capital. Investment decisions are the sole responsibility of each user.
      </p>
      <p className="text-gray-200">
        memecoins.org does not verify the accuracy of information shared by users and is not responsible for financial losses arising from the use of the site.
      </p>
    </div>
  )
}
