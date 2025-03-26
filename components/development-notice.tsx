import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DevelopmentNoticeProps {
  siteName: string
}

export function DevelopmentNotice({ siteName }: DevelopmentNoticeProps) {
  return (
    <div className="grid place-items-center h-[60vh]">
      <div className="max-w-xl space-y-6">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">Development in Progress</AlertTitle>
          <AlertDescription className="text-amber-700">
            {siteName} is currently under development. Monitoring data will be available soon.
          </AlertDescription>
        </Alert>

        <div className="p-6 bg-muted/20 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Development Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Hardware Installation</span>
              <span className="font-medium text-green-600">Completed</span>
            </div>
            <div className="flex justify-between">
              <span>Network Configuration</span>
              <span className="font-medium text-green-600">Completed</span>
            </div>
            <div className="flex justify-between">
              <span>Sensor Calibration</span>
              <span className="font-medium text-amber-600">In Progress</span>
            </div>
            <div className="flex justify-between">
              <span>MQTT Integration</span>
              <span className="font-medium text-amber-600">In Progress</span>
            </div>
            <div className="flex justify-between">
              <span>Database Setup</span>
              <span className="font-medium text-muted-foreground">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

