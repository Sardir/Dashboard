// MQTT Client implementation using real MQTT connection
import mqtt from "mqtt"

export class MqttClient {
  private client: any = null
  private url: string
  private connected = false
  private messageHandlers: Array<(topic: string, message: string) => void> = []
  private subscriptions: Set<string> = new Set()

  constructor(url: string) {
    this.url = url
    this.connect()
  }

  private connect() {
    console.log(`Connecting to MQTT broker at ${this.url}`)

    try {
      // Connect to the MQTT broker
      this.client = mqtt.connect(this.url, {
        clientId: `dashboard_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
      })

      this.client.on("connect", () => {
        console.log("Connected to MQTT broker")
        this.connected = true

        // Resubscribe to all topics
        this.subscriptions.forEach((topic) => {
          this.client.subscribe(topic, (err: any) => {
            if (err) {
              console.error(`Error subscribing to ${topic}:`, err)
            } else {
              console.log(`Subscribed to ${topic}`)
            }
          })
        })
      })

      this.client.on("message", (topic: string, message: Buffer) => {
        const messageStr = message.toString()
        console.log(`Received message on ${topic}: ${messageStr}`)

        // Notify all message handlers
        this.messageHandlers.forEach((handler) => {
          handler(topic, messageStr)
        })
      })

      this.client.on("error", (err: any) => {
        console.error("MQTT connection error:", err)
        this.connected = false
      })

      this.client.on("close", () => {
        console.log("MQTT connection closed")
        this.connected = false
      })
    } catch (error) {
      console.error("Failed to connect to MQTT broker:", error)
      this.connected = false

      // Fallback to simulation mode if connection fails
      this.startSimulation()
    }
  }

  subscribe(topic: string) {
    console.log(`Subscribing to topic: ${topic}`)
    this.subscriptions.add(topic)

    if (this.connected && this.client) {
      this.client.subscribe(topic, (err: any) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err)
        } else {
          console.log(`Subscribed to ${topic}`)
        }
      })
    }
  }

  unsubscribe(topic: string) {
    console.log(`Unsubscribing from topic: ${topic}`)
    this.subscriptions.delete(topic)

    if (this.connected && this.client) {
      this.client.unsubscribe(topic, (err: any) => {
        if (err) {
          console.error(`Error unsubscribing from ${topic}:`, err)
        } else {
          console.log(`Unsubscribed from ${topic}`)
        }
      })
    }
  }

  onMessage(callback: (topic: string, message: string) => void) {
    this.messageHandlers.push(callback)
  }

  // Fallback simulation mode if MQTT connection fails
  private startSimulation() {
    console.warn("Starting MQTT simulation mode")

    // Create a simulated MQTT client
    setInterval(() => {
      if (this.connected) return

      // Generate simulated data for subscribed topics
      this.subscriptions.forEach((topic) => {
        // Generate a random value based on the topic type
        let value = "0"

        if (topic.includes("Current")) {
          value = (Math.random() * 20 + 30).toFixed(1)
        } else if (topic.includes("Phase V") || topic.includes("Neutral V")) {
          value = (Math.random() * 10 + 220).toFixed(1)
        } else if (topic.includes("Active Power")) {
          value = (Math.random() * 5000 + 25000).toFixed(0)
        } else if (topic.includes("Total Active Power")) {
          value = (Math.random() * 10000 + 80000).toFixed(0)
        } else if (topic.includes("Frequency")) {
          value = (Math.random() * 0.5 + 49.8).toFixed(1)
        } else if (topic.includes("Water")) {
          value = Math.round(Math.random() * 20 + 70).toString()
        } else if (topic.includes("Airflow")) {
          value = (Math.random() * 2 + 7).toFixed(1)
        } else if (topic.includes("/T")) {
          value = Math.round(Math.random() * 20 + 20).toString()
        } else if (topic.includes("/H")) {
          value = Math.round(Math.random() * 30 + 40).toString()
        } else if (topic.includes("Network")) {
          value = "1"
        }

        // Notify all message handlers
        this.messageHandlers.forEach((handler) => {
          handler(topic, value)
        })
      })
    }, 5000) // Send messages every 5 seconds
  }

  disconnect() {
    console.log("Disconnecting from MQTT broker")
    if (this.client) {
      this.client.end()
    }
    this.connected = false
  }
}

