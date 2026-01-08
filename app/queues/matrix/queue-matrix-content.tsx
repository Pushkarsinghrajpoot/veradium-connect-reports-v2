"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search } from "lucide-react"

interface QueueData {
  queue_id: string
  channel: string
  initiation_method: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait_s: string
  avg_talk: string
  max_callers: string
  "%_answered": string
  "%_unanswered": string
  sla: string
}


interface APIResponse<T> {
  queryExecutionId: string
  status: string
  executionTime: number
  data: T[]
  columns: string[]
  rowCount: number
}

const API_ENDPOINT = "https://i2831zjef8.execute-api.us-east-1.amazonaws.com/prod/query"

export default function QueueMatrixContent() {
  const router = useRouter()
  const [queueData, setQueueData] = useState<QueueData[]>([])
  const [isLoadingQueues, setIsLoadingQueues] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Load queue summary data
  useEffect(() => {
    const fetchQueueData = async () => {
      setIsLoadingQueues(true)
      try {
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preparedStatement: "prep_distbyqueue",
            waitForResults: true,
            maxWaitTime: 60,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`)
        }

        const result: APIResponse<QueueData> = await response.json()
        setQueueData(result.data)
      } catch (error) {
        console.error("[v0] Queue data fetch error:", error)
        toast({
          variant: "destructive",
          title: "Failed to load queue data",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setIsLoadingQueues(false)
      }
    }

    fetchQueueData()
  }, [toast])


  const filteredQueues = queueData.filter((queue) => queue.queue_id.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleViewDetails = (queueId: string) => {
    router.push(`/queues/matrix/${encodeURIComponent(queueId)}`)
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">Queue Matrix</h2>
            <p className="text-muted-foreground">
              View real-time queue performance metrics. Click a queue ID to see detailed call records.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Queue Distribution</CardTitle>
                  <CardDescription>Summary statistics by queue</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queue ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingQueues ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading queue data...
                  </div>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Queue ID</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Answered</TableHead>
                        <TableHead>Abandoned</TableHead>
                        <TableHead>Avg Wait</TableHead>
                        <TableHead>Avg Talk</TableHead>
                        <TableHead>% Answered</TableHead>
                        <TableHead>SLA</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQueues.map((queue) => (
                        <TableRow key={queue.queue_id}>
                          <TableCell 
                            className="font-mono text-sm cursor-pointer text-primary hover:underline"
                            onClick={() => handleViewDetails(queue.queue_id)}
                          >
                            {queue.queue_id}
                          </TableCell>
                          <TableCell>{queue.channel}</TableCell>
                          <TableCell>{queue.initiation_method}</TableCell>
                          <TableCell>{queue.received}</TableCell>
                          <TableCell>{queue.answered}</TableCell>
                          <TableCell>{queue.abandoned}</TableCell>
                          <TableCell>{queue.avg_wait_s}</TableCell>
                          <TableCell>{queue.avg_talk || "-"}</TableCell>
                          <TableCell>{queue["%_answered"]}</TableCell>
                          <TableCell className="font-medium">{queue.sla}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(queue.queue_id)}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredQueues.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                            No queues found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
