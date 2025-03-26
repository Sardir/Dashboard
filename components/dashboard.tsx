"use client"

import { useState, useEffect } from "react"
import { Power, Bell } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MqttClient } from "@/lib/mqtt-client"
import { SiteGrid } from "@/components/site-grid"
import { useSiteContext } from "@/components/site-provider"

export default function Dashboard() {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedParameter, setSelectedParameter] = useState<string>("All Parameters")
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { alertCount } = useSiteContext()
  const [humidityAlertCount, setHumidityAlertCount] = useState<number>(1)
  const [powerAlertCount, setPowerAlertCount] = useState<number>(1)

  // Initialize MQTT client
  useEffect(() => {
    const client = new MqttClient("ws://64.227.163.97:8083/mqtt")
    setMqttClient(client)

    return () => {
      client.disconnect()
    }
  }, [])

  const handleFetchData = () => {
    setIsLoading(true)
    // Simulate data fetching delay
    setTimeout(() => {
      setIsLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Power className="h-6 w-6" />
          <h1 className="text-xl font-bold">Mining Facility Monitor</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="h-6 w-6" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      {alertCount > 0 && (
        <Alert className="rounded-none bg-red-50 border-red-200 text-red-500">
          <AlertDescription>Immediate attention required. Check alerts tab for details.</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Content */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Monitor and control your mining facilities in real-time</p>
        </div>

        {/* Sites Grid */}
        <SiteGrid />
      </div>
    </div>
  )
}

