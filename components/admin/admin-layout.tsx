"use client"

import React, { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={setCollapsed} />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "pl-16" : "pl-64"
        }`}
      >

        {/* 🔹 HEADER DO MÓDULO */}
        <Header title={title} />

        {/* 🔹 CONTEÚDO */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
