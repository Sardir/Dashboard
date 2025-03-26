import { SiteDetail } from "@/components/site-detail"
import { sitesConfig } from "@/lib/sites-config"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return Object.keys(sitesConfig).map((key) => ({
    id: sitesConfig[key].id,
  }))
}

export default function SitePage({ params }: { params: { id: string } }) {
  // Find the site by ID
  const siteEntry = Object.entries(sitesConfig).find(([_, site]) => site.id === params.id)

  if (!siteEntry) {
    notFound()
  }

  const [siteName, siteData] = siteEntry

  return (
    <main className="min-h-screen">
      <SiteDetail siteName={siteName} siteData={siteData} />
    </main>
  )
}

