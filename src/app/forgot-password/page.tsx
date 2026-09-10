import { ForgotPasswordForm } from "./forgot-password-form"

export const metadata = {
  title: "Forgot password - degenscult",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}