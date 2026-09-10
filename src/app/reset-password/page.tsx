import { Suspense } from "react"
import { ResetPasswordForm } from "./reset-password-form"

export const metadata = {
  title: "Reset password - degenscult",
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-500">Checking your reset link...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}