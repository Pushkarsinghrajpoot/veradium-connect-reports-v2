"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"

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

interface QueueDetailData {
  row_no: string
  contact_id: string
  agent: string
  date: string
  queue: string
  number: string
  event: string
  ring_time: string
  wait_time: string
  talk_time: string
  DID: string
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

export default function QueueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const queueId = params?.queueId as string
  const [queueData, setQueueData] = useState<QueueData | null>(null)
  const [detailData, setDetailData] = useState<QueueDetailData[]>([])
  const [isLoadingQueue, setIsLoadingQueue] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const { toast } = useToast()

  // Load queue summary data for the specific queue
  useEffect(() => {
    if (!queueId) return

    const fetchQueueData = async () => {
      setIsLoadingQueue(true)
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
        const foundQueue = result.data.find(q => q.queue_id === queueId)
        setQueueData(foundQueue || null)
      } catch (error) {
        console.error("[v0] Queue data fetch error:", error)
        toast({
          variant: "destructive",
          title: "Failed to load queue data",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setIsLoadingQueue(false)
      }
    }

    fetchQueueData()
  }, [queueId, toast])

  // Load detailed queue data
  useEffect(() => {
    if (!queueId) return

    const fetchDetailData = async () => {
      setIsLoadingDetails(true)
      try {
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preparedStatement: "prep_distbyqueue_dd",
            parameters: [queueId],
            waitForResults: true,
            maxWaitTime: 60,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`)
        }

        const result: APIResponse<QueueDetailData> = await response.json()
        setDetailData(result.data)
      } catch (error) {
        console.error("[v0] Queue detail fetch error:", error)
        toast({
          variant: "destructive",
          title: "Failed to load queue details",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchDetailData()
  }, [queueId, toast])

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Queue Matrix
            </Button>
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold tracking-tight">Queue Details</h2>
              <p className="text-muted-foreground">
                Detailed view for queue: <span className="font-mono">{queueId}</span>
              </p>
            </div>
          </div>

          {/* Queue Summary Card */}
          {isLoadingQueue ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading queue summary...
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : queueData ? (
            <Card>
              <CardHeader>
                <CardTitle>Queue Summary</CardTitle>
                <CardDescription>Performance metrics for this queue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Received</p>
                    <p className="text-2xl font-bold">{queueData.received}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Answered</p>
                    <p className="text-2xl font-bold text-green-600">{queueData.answered}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Abandoned</p>
                    <p className="text-2xl font-bold text-red-600">{queueData.abandoned}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Wait</p>
                    <p className="text-2xl font-bold">{queueData.avg_wait_s}s</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">% Answered</p>
                    <p className="text-2xl font-bold">{queueData["%_answered"]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SLA</p>
                    <p className="text-2xl font-bold">{queueData.sla}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Queue not found
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Call Records</CardTitle>
              <CardDescription>Detailed call records for this queue</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading call records...
                  </div>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact ID</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Ring Time</TableHead>
                        <TableHead>Wait Time</TableHead>
                        <TableHead>Talk Time</TableHead>
                        <TableHead>DID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailData.map((record) => (
                        <TableRow key={record.contact_id}>
                          <TableCell className="font-mono">{record.contact_id}</TableCell>
                          <TableCell>{record.agent || "-"}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.number}</TableCell>
                          <TableCell>
                            <span className="inline-block px-2 py-1 rounded text-sm bg-muted">{record.event}</span>
                          </TableCell>
                          <TableCell>{record.ring_time || "-"}</TableCell>
                          <TableCell>{record.wait_time || "-"}</TableCell>
                          <TableCell>{record.talk_time || "-"}</TableCell>
                          <TableCell>{record.DID}</TableCell>
                        </TableRow>
                      ))}
                      {detailData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            No call records found.
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
