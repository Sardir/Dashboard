"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { MqttClient } from "@/lib/mqtt-client"

interface MqttContextType {
  mqttClient: MqttClient | null
  mqttData: Record<string, string>
}

const MqttContext = createContext<MqttContextType | undefined>(undefined)

export function MqttProvider({ children }: { children: ReactNode }) {
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null)
  const [mqttData, setMqttData] = useState<Record<string, string>>({})

  // Initialize MQTT client
  useEffect(() => {
    // Use port 1883 as requested
    const client = new MqttClient("mqtt://64.227.163.97:8083")

    client.onMessage((topic, message) => {
      setMqttData((prev) => ({
        ...prev,
        [topic]: message,
      }))
    })

    setMqttClient(client)

    return () => {
      client.disconnect()
    }
  }, [])

  return <MqttContext.Provider value={{ mqttClient, mqttData }}>{children}</MqttContext.Provider>
}

export function useMqttContext() {
  const context = useContext(MqttContext)
  if (context === undefined) {
    throw new Error("useMqttContext must be used within a MqttProvider")
  }
  return context
}

