import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Badge } from '../lib/shadcn/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../lib/shadcn/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../lib/shadcn/table'

type Kpi = {
  label: string
  value: string
  delta: number
  icon: typeof DollarSign
}

const KPIS: Kpi[] = [
  { label: 'Revenue', value: '$48,210', delta: 12.4, icon: DollarSign },
  { label: 'Active users', value: '3,842', delta: 4.1, icon: Users },
  { label: 'Orders', value: '1,210', delta: -2.3, icon: ShoppingCart },
  { label: 'Conversion', value: '3.6%', delta: 0.8, icon: TrendingUp },
]

const REVENUE_SERIES = [
  { month: 'Jan', revenue: 24000, orders: 620 },
  { month: 'Feb', revenue: 27500, orders: 690 },
  { month: 'Mar', revenue: 31200, orders: 740 },
  { month: 'Apr', revenue: 29800, orders: 710 },
  { month: 'May', revenue: 35400, orders: 820 },
  { month: 'Jun', revenue: 38900, orders: 900 },
  { month: 'Jul', revenue: 42100, orders: 970 },
  { month: 'Aug', revenue: 40500, orders: 940 },
  { month: 'Sep', revenue: 44800, orders: 1020 },
  { month: 'Oct', revenue: 46300, orders: 1080 },
  { month: 'Nov', revenue: 47900, orders: 1150 },
  { month: 'Dec', revenue: 48210, orders: 1210 },
]

type ActivityStatus = 'completed' | 'pending' | 'refunded'

type Activity = {
  id: string
  customer: string
  email: string
  amount: number
  status: ActivityStatus
  date: string
}

const ACTIVITY: Activity[] = [
  { id: 'INV-1042', customer: 'Avery Chen', email: 'avery@northwind.io', amount: 248.0, status: 'completed', date: '2025-01-14' },
  { id: 'INV-1041', customer: 'Jamie Rivera', email: 'jamie@acme.co', amount: 89.5, status: 'pending', date: '2025-01-14' },
  { id: 'INV-1040', customer: 'Morgan Patel', email: 'morgan@globex.com', amount: 1240.0, status: 'completed', date: '2025-01-13' },
  { id: 'INV-1039', customer: 'Sasha Kim', email: 'sasha@initech.dev', amount: 56.25, status: 'refunded', date: '2025-01-13' },
  { id: 'INV-1038', customer: 'Riley Foster', email: 'riley@umbrella.io', amount: 412.75, status: 'completed', date: '2025-01-12' },
  { id: 'INV-1037', customer: 'Quinn Alvarez', email: 'quinn@hooli.com', amount: 178.0, status: 'pending', date: '2025-01-12' },
]

const STATUS_STYLES: Record<ActivityStatus, string> = {
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  refunded: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function Dashboard() {
  const totals = useMemo(() => {
    const totalRevenue = REVENUE_SERIES.reduce((sum, d) => sum + d.revenue, 0)
    const totalOrders = REVENUE_SERIES.reduce((sum, d) => sum + d.orders, 0)
    return { totalRevenue, totalOrders }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your store performance for the last 12 months.
          </p>
        </header>

        {/* KPI cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((kpi) => {
            const Icon = kpi.icon
            const positive = kpi.delta >= 0
            return (
              <Card key={kpi.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{kpi.value}</div>
                  <div
                    className={
                      'mt-1 flex items-center gap-1 text-xs ' +
                      (positive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400')
                    }
                  >
                    {positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    <span>{Math.abs(kpi.delta).toFixed(1)}%</span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>
                Total: {formatCurrency(totals.totalRevenue)} across the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={REVENUE_SERIES} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      color: 'hsl(var(--popover-foreground))',
                      fontSize: 12,
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                {totals.totalOrders.toLocaleString()} orders this year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={REVENUE_SERIES} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      color: 'hsl(var(--popover-foreground))',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest orders from your store</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ACTIVITY.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{row.customer}</span>
                        <span className="text-xs text-muted-foreground">{row.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_STYLES[row.status]}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
