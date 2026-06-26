"use client"

import useSWR from "swr"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type UnknownRecord = Record<string, unknown>

type PaymentStatusKey = "paid" | "pending" | "processing" | "failed"

type PaymentStatusDatum = {
  key: PaymentStatusKey
  status: string
  value: number
}

const STATUS_COLORS: Record<PaymentStatusKey, string> = {
  paid: "#4c9868",
  pending: "#DDBA88",
  processing: "#003658",
  failed: "#D28A71",
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" })

  if (!response.ok) {
    throw new Error("No se pudieron cargar los datos")
  }

  return response.json()
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function extractArray(data: unknown): UnknownRecord[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord)
  }

  if (!isRecord(data)) return []

  const possibleKeys = ["trabajos", "jobs", "data", "items", "payments"]

  for (const key of possibleKeys) {
    const value = data[key]

    if (Array.isArray(value)) {
      return value.filter(isRecord)
    }
  }

  return []
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase().trim() : ""
}

function getPaymentStatus(item: UnknownRecord): PaymentStatusKey {
  const directStatus =
    getString(item.paymentStatus) ||
    getString(item.estadoPago) ||
    getString(item.statusPago) ||
    getString(item.payment_status)

  if (
    directStatus === "paid" ||
    directStatus === "pagado" ||
    directStatus === "acreditado"
  ) {
    return "paid"
  }

  if (
    directStatus === "processing" ||
    directStatus === "procesando" ||
    directStatus === "en_proceso" ||
    directStatus === "en proceso"
  ) {
    return "processing"
  }

  if (
    directStatus === "failed" ||
    directStatus === "fallido" ||
    directStatus === "rechazado"
  ) {
    return "failed"
  }

  if (
    directStatus === "pending" ||
    directStatus === "pendiente"
  ) {
    return "pending"
  }

  const payment = item.payment

  if (isRecord(payment)) {
    const nestedStatus =
      getString(payment.status) ||
      getString(payment.estado) ||
      getString(payment.paymentStatus)

    if (
      nestedStatus === "paid" ||
      nestedStatus === "pagado" ||
      nestedStatus === "acreditado"
    ) {
      return "paid"
    }

    if (
      nestedStatus === "processing" ||
      nestedStatus === "procesando" ||
      nestedStatus === "en_proceso" ||
      nestedStatus === "en proceso"
    ) {
      return "processing"
    }

    if (
      nestedStatus === "failed" ||
      nestedStatus === "fallido" ||
      nestedStatus === "rechazado"
    ) {
      return "failed"
    }

    if (
      nestedStatus === "pending" ||
      nestedStatus === "pendiente"
    ) {
      return "pending"
    }
  }

  const jobStatus = getString(item.estado) || getString(item.status)

  if (
    jobStatus === "completado" ||
    jobStatus === "completed" ||
    jobStatus === "paid" ||
    jobStatus === "pagado"
  ) {
    return "paid"
  }

  if (
    jobStatus === "processing" ||
    jobStatus === "procesando" ||
    jobStatus === "en_proceso" ||
    jobStatus === "en proceso"
  ) {
    return "processing"
  }

  if (
    jobStatus === "failed" ||
    jobStatus === "fallido" ||
    jobStatus === "cancelado" ||
    jobStatus === "cancelled"
  ) {
    return "failed"
  }

  return "pending"
}

function buildPaymentStatusData(items: UnknownRecord[]): PaymentStatusDatum[] {
  const summary: Record<PaymentStatusKey, number> = {
    paid: 0,
    pending: 0,
    processing: 0,
    failed: 0,
  }

  for (const item of items) {
    const status = getPaymentStatus(item)
    summary[status]++
  }

  return [
    {
      key: "paid",
      status: "Pagados",
      value: summary.paid,
    },
    {
      key: "pending",
      status: "Pendientes",
      value: summary.pending,
    },
    {
      key: "processing",
      status: "En proceso",
      value: summary.processing,
    },
    {
      key: "failed",
      status: "Fallidos",
      value: summary.failed,
    },
  ]
}

export function PaymentStatusChart() {
  const { data, isLoading, error } = useSWR("/api/trabajos", fetcher)

  const items = extractArray(data)
  const chartData = buildPaymentStatusData(items)
  const total = chartData.reduce((acc, item) => acc + item.value, 0)

  return (
    <Card className="border-border shadow-sm flex flex-col h-full">
      <CardHeader>
        <CardTitle>Estado de pagos</CardTitle>
        <CardDescription>
          {isLoading || error
            ? "Seguimiento de operaciones según estado de pago · Payments App"
            : `${total} operaciones en total · Payments App`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-6">
        {isLoading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : error ? (
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar los estados de pago.
          </p>
        ) : (
          <div className="h-[240px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 12,
                  left: -12,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="status"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  fontSize={12}
                />

                <Tooltip
                  formatter={(value) => [`${value ?? 0}`, "Cantidad"]}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />

                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                  {chartData.map((item) => (
                    <Cell
                      key={item.key}
                      fill={STATUS_COLORS[item.key]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}