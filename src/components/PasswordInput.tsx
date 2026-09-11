"use client"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  minLength?: number
}

const inputClass =
  "w-full px-3 py-2 pr-10 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent"

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete,
  minLength,
}: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          placeholder={placeholder}
          required
          minLength={minLength}
          title={
            minLength
              ? "At least 8 characters, with at least one uppercase letter and one number"
              : undefined
          }
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-neon hover:bg-gray-800 transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}