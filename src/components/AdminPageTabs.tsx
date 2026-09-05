"use client"
import { useState } from "react"
import { AdminReportsList } from "@/components/AdminReportsList"
import { VipManagement } from "@/components/VipManagement"

type Report = {
  id: string
  reason: string
  createdAt: string
  reporter: { username: string }
  post: {
    id: string
    title: string
    body: string
    author: { username: string }
  } | null
  reply: { id: string; body: string; author: { username: string } } | null
  reportedUser: { id: string; username: string; avatarUrl: string | null } | null
}

type AdminPageTabsProps = {
  reports: Report[]
}

export function AdminPageTabs({ reports }: AdminPageTabsProps) {
  const [activeTab, setActiveTab] = useState<"reports" | "vip">("reports")

  return (
    <div>
      <div className="flex gap-6 border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "reports"
              ? "text-neon border-neon"
              : "text-gray-500 border-transparent hover:text-gray-300"
          }`}
        >
          Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("vip")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "vip"
              ? "text-neon border-neon"
              : "text-gray-500 border-transparent hover:text-gray-300"
          }`}
        >
          VIP Management
        </button>
      </div>

      {activeTab === "reports" && (
        <AdminReportsList
          reports={reports.map((report) => ({
            ...report,
          }))}
        />
      )}

      {activeTab === "vip" && <VipManagement />}
    </div>
  )
}
