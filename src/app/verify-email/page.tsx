import { Suspense } from "react"
import { VerifyEmail } from "./verify-email-client"

export const metadata = {
  title: "Verify email - degenscult",
}

export default function VerifyEmailPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-500">Checking your verification link...</p>
            </div>
          }
        >
          <VerifyEmail />
        </Suspense>
      </div>
    </div>
  )
}