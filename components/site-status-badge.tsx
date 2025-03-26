import { Badge } from "@/components/ui/badge"

type StatusType = "active" | "inactive" | "development"

interface SiteStatusBadgeProps {
  status?: StatusType
}

export function SiteStatusBadge({ status = "inactive" }: SiteStatusBadgeProps) {
  const statusConfig = {
    active: {
      className: "bg-green-100 text-green-800 hover:bg-green-100",
      label: "Active",
    },
    inactive: {
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
      label: "Inactive",
    },
    development: {
      className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      label: "Under Development",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

