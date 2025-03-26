"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { sitesConfig, sitesList, type SiteType } from "@/lib/sites-config"
import { useMqttContext } from "@/components/mqtt-provider"

interface SiteContextType {
  selectedSite: string
  siteData: SiteType
  alertCount: number
  siteAlerts: Record<string, number>
  setSite: (siteName: string) => void
  getSiteStatus: (siteName: string) => "normal" | "warning" | "critical"
}

const SiteContext = createContext<SiteContextType | undefined>(undefined)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [selectedSite, setSelectedSite] = useState<string>("F21: Al Faqah")
  const [siteData, setSiteData] = useState<SiteType>(sitesConfig[selectedSite])
  const [alertCount, setAlertCount] = useState<number>(0)
  const [siteAlerts, setSiteAlerts] = useState<Record<string, number>>({})
  const { mqttClient } = useMqttContext()

  // Initialize site alerts
  useEffect(() => {
    const initialAlerts: Record<string, number> = {}
    sitesList.forEach((site) => {
      // Randomly assign 0-2 alerts to each site for initial state
      initialAlerts[site.name] = Math.floor(Math.random() * 3)
    })
    setSiteAlerts(initialAlerts)

    // Calculate total alert count
    const total = Object.values(initialAlerts).reduce((sum, count) => sum + count, 0)
    setAlertCount(total)
  }, [])

  const setSite = (siteName: string) => {
    setSelectedSite(siteName)
    setSiteData(sitesConfig[siteName])
  }

  const getSiteStatus = (siteName: string): "normal" | "warning" | "critical" => {
    const site = sitesConfig[siteName]

    if (!site || site.status === "development") {
      return "normal"
    }

    const alertsForSite = siteAlerts[siteName] || 0

    if (alertsForSite >= 2) {
      return "critical"
    } else if (alertsForSite === 1) {
      return "warning"
    }

    return "normal"
  }

  return (
    <SiteContext.Provider
      value={{
        selectedSite,
        siteData,
        alertCount,
        siteAlerts,
        setSite,
        getSiteStatus,
      }}
    >
      {children}
    </SiteContext.Provider>
  )
}

export function useSiteContext() {
  const context = useContext(SiteContext)
  if (context === undefined) {
    throw new Error("useSiteContext must be used within a SiteProvider")
  }
  return context
}

