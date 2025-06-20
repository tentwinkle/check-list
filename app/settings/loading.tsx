import { Navigation } from "@/components/ui/navigation"

export default function SettingsLoading() {
  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />

      <div className="container mx-auto mobile-padding py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-4">
            <div className="h-10 bg-white/10 rounded-lg w-48 mx-auto animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Settings Cards Skeleton */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass border-white/20 shadow-xl rounded-xl p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="h-6 bg-white/10 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-white/10 rounded w-48 animate-pulse"></div>
                  </div>

                  <div className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-4 bg-white/10 rounded w-24 animate-pulse"></div>
                          <div className="h-3 bg-white/10 rounded w-32 animate-pulse"></div>
                        </div>
                        <div className="h-6 bg-white/10 rounded-full w-11 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Change Password Skeleton */}
          <div className="glass border-white/20 shadow-xl rounded-xl p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-6 bg-white/10 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded w-64 animate-pulse"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-white/10 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="h-10 bg-white/10 rounded w-40 animate-pulse"></div>
            </div>
          </div>

          {/* Save Button Skeleton */}
          <div className="flex justify-end">
            <div className="h-12 bg-white/10 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
