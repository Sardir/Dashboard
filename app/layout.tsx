import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteProvider } from "@/components/site-provider"
import { MqttProvider } from "@/components/mqtt-provider"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Mining Facility Monitor",
  description: "Real-time monitoring dashboard for mining facilities",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <MqttProvider>
            <SiteProvider>{children}</SiteProvider>
          </MqttProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'