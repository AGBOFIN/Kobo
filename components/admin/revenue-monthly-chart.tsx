'use client'

type MonthPoint = {
  month: string
  revenue: number
  sales: number
}

/**
 * Histogramme simple des revenus mensuels (CSS pur — aucune dépendance,
 * lisible sur mobile).
 */
export function RevenueMonthlyChart({ data }: { data: MonthPoint[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="flex h-40 items-end gap-2 sm:gap-4">
      {data.map(point => {
        const heightPct = Math.round((point.revenue / max) * 100)
        return (
          <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-semibold text-stone-700">
              {point.revenue > 0 ? point.revenue.toLocaleString('fr-FR') : ''}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-lg transition-all ${
                  point.revenue > 0
                    ? 'bg-gradient-to-t from-primary-600 to-emerald-400'
                    : 'bg-stone-100'
                }`}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
                title={`${point.sales} vente(s) — ${point.revenue.toLocaleString('fr-FR')} FCFA`}
              />
            </div>
            <span className="text-xs text-stone-500">{point.month}</span>
          </div>
        )
      })}
    </div>
  )
}
