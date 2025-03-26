"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface HistoricalChartProps {
  selectedTimeStamp: string
}

export function HistoricalChart({ selectedTimeStamp }: HistoricalChartProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 7)))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [selectedParameter, setSelectedParameter] = useState<string>("Current")
  const [selectedRoom, setSelectedRoom] = useState<string>("Filter Room")
  const [loading, setLoading] = useState<boolean>(false)
  const [chartData, setChartData] = useState<any[]>([])

  // Room parameters configuration
  const roomParameters = {
    "Filter Room": { temp: "Ts1", humidity: "H1s1" },
    "Mining Room": { temp: "Ts2", humidity: "H2s2" },
    "RPI Room": { temp: "Ts3", humidity: "H3s3" },
    "Exhaust Room": { temp: "Ts4", humidity: "H4s4" },
  }

  // List of parameters to select from
  const parameters = [
    { value: "Current", label: "Current" },
    { value: "Voltage", label: "Voltage" },
    { value: "Total Active Power", label: "Total Active Power" },
    { value: "Temperature & Humidity", label: "Temperature & Humidity" },
  ]

  // Fetch data from the database
  const fetchData = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates")
      return
    }

    setLoading(true)

    try {
      // Simulate API call with generated data
      // In production, this would be a real API call to your database
      setTimeout(() => {
        const data = generateMockData(selectedParameter, startDate, endDate)
        setChartData(data)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoading(false)
    }
  }

  // Generate mock data for demo
  const generateMockData = (paramType: string, start: Date, end: Date) => {
    const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24))
    const data = []

    for (let i = 0; i < daysBetween; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)

      const entry: any = {
        date: format(date, "yyyy-MM-dd"),
      }

      if (paramType === "Current") {
        entry["L1"] = Math.random() * 20 + 10
        entry["L2"] = Math.random() * 20 + 10
        entry["L3"] = Math.random() * 20 + 10
      } else if (paramType === "Voltage") {
        entry["V1"] = Math.random() * 10 + 220
        entry["V2"] = Math.random() * 10 + 220
        entry["V3"] = Math.random() * 10 + 220
      } else if (paramType === "Total Active Power") {
        entry["Power L1"] = Math.random() * 1000 + 3000
        entry["Power L2"] = Math.random() * 1000 + 3000
        entry["Power L3"] = Math.random() * 1000 + 3000
      } else if (paramType === "Temperature & Humidity") {
        entry["Temperature"] = Math.random() * 15 + 20
        entry["Humidity"] = Math.random() * 30 + 40
      }

      data.push(entry)
    }

    return data
  }

  // Define colors for chart lines
  const lineColors = [
    "#1ab7ea", // Blue
    "#f39c12", // Orange
    "#2ecc71", // Green
    "#e74c3c", // Red
    "#9b59b6", // Purple
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Date Range Selector */}
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>
          <span className="mx-2">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Parameter Selector */}
        <div className="flex items-center gap-4">
          <Select value={selectedParameter} onValueChange={setSelectedParameter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select parameter" />
            </SelectTrigger>
            <SelectContent>
              {parameters.map((param) => (
                <SelectItem key={param.value} value={param.value}>
                  {param.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedParameter === "Temperature & Humidity" && (
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(roomParameters).map((room) => (
                  <SelectItem key={room} value={room}>
                    {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Fetch Data"}
          </Button>
        </div>
      </div>

      {/* Chart */}
      <Card className="p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" padding={{ left: 30, right: 30 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(chartData[0])
                .filter((key) => key !== "date")
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={lineColors[index % lineColors.length]}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] border rounded-md bg-muted/10">
            <p className="text-muted-foreground">
              {loading ? "Loading chart data..." : "Select parameters and fetch data to view chart"}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

