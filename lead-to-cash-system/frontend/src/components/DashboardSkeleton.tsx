import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardSkeleton() {
    return (
        <div className="container mx-auto p-6 space-y-8">
            <Skeleton className="h-9 w-48" />

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32 mb-2" />
                            <Skeleton className="h-3 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1 min-h-[400px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center">
                        <div className="flex flex-col gap-2 w-full items-center">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-8 w-2/3" />
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-8 w-1/3" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-1 min-h-[400px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center">
                        <Skeleton className="h-full w-full rounded-xl" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
