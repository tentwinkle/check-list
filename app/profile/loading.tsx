import { Navigation } from "@/components/ui/navigation"

export default function ProfileLoading() {
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview Skeleton */}
            <div className="lg:col-span-1">
              <div className="glass border-white/20 shadow-xl rounded-xl p-6">
                <div className="text-center space-y-6">
                  <div className="h-24 w-24 bg-white/10 rounded-full mx-auto animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-6 bg-white/10 rounded w-32 mx-auto animate-pulse"></div>
                    <div className="h-4 bg-white/10 rounded w-48 mx-auto animate-pulse"></div>
                    <div className="h-6 bg-white/10 rounded-full w-24 mx-auto animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass border-white/20 shadow-xl rounded-xl p-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-6 bg-white/10 rounded w-48 animate-pulse"></div>
                      <div className="h-4 bg-white/10 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="h-9 bg-white/10 rounded w-20 animate-pulse"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-white/10 rounded w-24 animate-pulse"></div>
                        <div className="h-10 bg-white/10 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-16 animate-pulse"></div>
                    <div className="h-24 bg-white/10 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Statistics Skeleton */}
              <div className="glass border-white/20 shadow-xl rounded-xl p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-6 bg-white/10 rounded w-40 animate-pulse"></div>
                    <div className="h-4 bg-white/10 rounded w-56 animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-4 rounded-lg bg-white/5">
                        <div className="h-8 bg-white/10 rounded w-12 mx-auto mb-2 animate-pulse"></div>
                        <div className="h-4 bg-white/10 rounded w-16 mx-auto animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
