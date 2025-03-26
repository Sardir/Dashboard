"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Power, Bell, Calendar, ChevronLeft, Building2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import type { SiteType } from "@/lib/sites-config"
import { useMqttContext } from "@/components/mqtt-provider"
import { useSiteContext } from "@/components/site-provider"
import { PowerMonitoring } from "@/components/site-metrics/power-monitoring"
import { TemperatureMonitoring } from "@/components/site-metrics/temperature-monitoring"
import { HumidityMonitoring } from "@/components/site-metrics/humidity-monitoring"
import { WaterLevels } from "@/components/site-metrics/water-levels"
import { AirFlow } from "@/components/site-metrics/air-flow"
import { NetworkStatus } from "@/components/site-metrics/network-status"
import { EnhancedHistoricalChart } from "@/components/site-metrics/enhanced-historical-chart"
import { DevelopmentNotice } from "@/components/development-notice"
import { CameraStatus } from "@/components/camera-status"

interface SiteDetailProps {
  siteName: string
  siteData: SiteType
}

export function SiteDetail({ siteName, siteData }: SiteDetailProps) {
  const router = useRouter()
  const { mqttClient, mqttData } = useMqttContext()
  const { alertCount, siteAlerts } = useSiteContext()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedParameter, setSelectedParameter] = useState<string>("All Parameters")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("overview")

  const isDevelopmentSite = siteData.status === "development"
  const siteAlertCount = siteAlerts[siteName] || 0

  // Subscribe to all MQTT topics for this site
  useEffect(() => {
    if (!mqttClient || isDevelopmentSite) return

    // Collect all topics for this site
    const allTopics = [
      ...siteData.currentTopics,
      ...siteData.subTopics,
      ...siteData.voltageTopics,
      ...siteData.voltageSubTopics,
      ...siteData.powerTopics,
      ...siteData.powerSubTopics,
      ...siteData.neutralTopics,
      ...siteData.subNeutralTopics,
      ...siteData.tempTopics,
      ...siteData.humTopics,
      ...siteData.waterTopics,
      ...siteData.airflowTopics,
      ...siteData.networkTopics,
    ].filter(Boolean)

    // Subscribe to all topics
    allTopics.forEach((topic) => {
      mqttClient.subscribe(topic)
    })

    return () => {
      // Unsubscribe when component unmounts
      allTopics.forEach((topic) => {
        mqttClient.unsubscribe(topic)
      })
    }
  }, [mqttClient, siteData, isDevelopmentSite])

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
      {siteAlertCount > 0 && (
        <Alert className="rounded-none bg-red-50 border-red-200 text-red-500">
          <AlertDescription>
            {siteAlertCount} {siteAlertCount === 1 ? "alert" : "alerts"} detected for {siteName}. Check alerts tab for
            details.
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Content */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button variant="outline" size="sm" className="mb-2" onClick={() => router.push("/")}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <h2 className="text-2xl font-bold">{siteName}</h2>
              {siteData.status && (
                <Badge variant={siteData.status === "active" ? "default" : "outline"} className="ml-2">
                  {siteData.status === "development" ? "Under Development" : "Active"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Detailed monitoring and control</p>
          </div>

          {!isDevelopmentSite && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] pl-3 text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(date, "MMMM do, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Parameters">All Parameters</SelectItem>
                  <SelectItem value="Current">Current</SelectItem>
                  <SelectItem value="Voltage">Voltage</SelectItem>
                  <SelectItem value="Power">Power</SelectItem>
                  <SelectItem value="Temperature">Temperature</SelectItem>
                  <SelectItem value="Humidity">Humidity</SelectItem>
                  <SelectItem value="Water Levels">Water Levels</SelectItem>
                  <SelectItem value="Air Flow">Air Flow</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleFetchData} disabled={isLoading}>
                {isLoading ? "Loading..." : "Fetch Data"}
              </Button>
            </div>
          )}
        </div>

        {isDevelopmentSite ? (
          <DevelopmentNotice siteName={siteName} />
        ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="overview" className="flex-1">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="power" className="flex-1">
                  Power
                </TabsTrigger>
                <TabsTrigger value="environment" className="flex-1">
                  Environment
                </TabsTrigger>
                <TabsTrigger value="network" className="flex-1">
                  Network
                </TabsTrigger>
                <TabsTrigger value="cameras" className="flex-1">
                  Cameras
                </TabsTrigger>
                <TabsTrigger value="historical" className="flex-1">
                  Historical Data
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex-1 relative">
                  Alerts
                  {siteAlertCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {siteAlertCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab Content */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <PowerMonitoring siteData={siteData} mqttData={mqttData} />
                  <TemperatureMonitoring siteData={siteData} mqttData={mqttData} />
                  <HumidityMonitoring siteData={siteData} mqttData={mqttData} />
                  <WaterLevels siteData={siteData} mqttData={mqttData} />
                  <AirFlow siteData={siteData} mqttData={mqttData} />
                  <NetworkStatus siteData={siteData} mqttData={mqttData} />
                </div>
              </TabsContent>

              {/* Power Tab Content */}
              <TabsContent value="power">
                <div className="grid grid-cols-1 gap-6">
                  <PowerMonitoring siteData={siteData} mqttData={mqttData} expanded={true} />
                </div>
              </TabsContent>

              {/* Environment Tab Content */}
              <TabsContent value="environment">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TemperatureMonitoring siteData={siteData} mqttData={mqttData} expanded={true} />
                  <HumidityMonitoring siteData={siteData} mqttData={mqttData} expanded={true} />
                  <WaterLevels siteData={siteData} mqttData={mqttData} expanded={true} />
                  <AirFlow siteData={siteData} mqttData={mqttData} expanded={true} />
                </div>
              </TabsContent>

              {/* Network Tab Content */}
              <TabsContent value="network">
                <div className="grid grid-cols-1 gap-6">
                  <NetworkStatus siteData={siteData} mqttData={mqttData} expanded={true} />
                </div>
              </TabsContent>

              {/* Cameras Tab Content */}
              <TabsContent value="cameras">
                <div className="grid grid-cols-1 gap-6">
                  <CameraStatus siteId={siteData.id} siteName={siteName} />
                </div>
              </TabsContent>

              {/* Historical Data Tab Content */}
              <TabsContent value="historical">
                <div className="grid grid-cols-1 gap-6">
                  <EnhancedHistoricalChart selectedTimeStamp={siteData.selectedTimeStamp} date={date} />
                </div>
              </TabsContent>

              {/* Alerts Tab Content */}
              <TabsContent value="alerts">
                <div className="space-y-4">
                  {siteAlertCount > 0 ? (
                    <>
                      <Alert className="bg-red-50 border-red-200">
                        <AlertDescription className="flex justify-between">
                          <span>Temperature differential exceeding safe limits</span>
                          <span className="text-sm text-muted-foreground">Today, 10:30 AM</span>
                        </AlertDescription>
                      </Alert>
                      {siteAlertCount > 1 && (
                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertDescription className="flex justify-between">
                            <span>Power consumption approaching maximum capacity</span>
                            <span className="text-sm text-muted-foreground">Today, 09:12 AM</span>
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">No alerts for this site</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

