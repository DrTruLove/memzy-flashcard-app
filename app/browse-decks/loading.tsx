"use client"

import { Card } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function BrowseDecksLoading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header skeleton */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <BookOpen className="h-16 w-16 text-purple-600" />
            </div>
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            <Skeleton className="h-5 w-96 mx-auto" />
            <div className="mt-6">
              <Skeleton className="h-10 w-40 mx-auto" />
            </div>
          </div>

          {/* Deck cards skeleton */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[3/2] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
