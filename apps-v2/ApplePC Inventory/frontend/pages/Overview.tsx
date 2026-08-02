// A short read on the shape of the collection, plus the integrity numbers that
// are otherwise invisible: products carrying no pieces, and pieces that point
// at nothing. Those don't show up in any grouped view, so they're stated here.

import { useGetStats } from '../hooks/backend/inventory'
import { useAutoTrigger } from '../lib/hooks'
import type { Stats } from '../lib/types'
import { Completeness, Spinner } from '../components/ui'

export function Overview({ onInspectOrphans }: { onInspectOrphans: () => void }) {
  const hook = useGetStats()
  useAutoTrigger(hook.trigger, {})
  const stats = hook.data as Stats | undefined

  if (hook.error !== null) {
    return (
      <div className="iv-overview">
        <div className="iv-error">{hook.error}</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="iv-placeholder">
        <Spinner />
      </div>
    )
  }

  // "Well represented" is the user's own framing: Complete and Mostly Complete
  // are the hallmarks of the collection, Partial and Non-Original are not.
  const strong = stats.byCompleteness
    .filter((b) => b.value === 'Complete' || b.value === 'Mostly Complete')
    .reduce((sum, b) => sum + b.count, 0)

  const largest = Math.max(...stats.byCompleteness.map((b) => b.count), 1)
  const issues = stats.unassignedPieces + stats.danglingPieces

  return (
    <div className="iv-overview">
      <div className="iv-stats">
        <div className="iv-stat">
          <div className="iv-stat-label">Products</div>
          <div className="iv-stat-value">{stats.products.toLocaleString()}</div>
        </div>
        <div className="iv-stat">
          <div className="iv-stat-label">Pieces</div>
          <div className="iv-stat-value">{stats.pieces.toLocaleString()}</div>
          <div className="iv-stat-sub">
            {(stats.pieces / Math.max(stats.products, 1)).toFixed(1)} per product
          </div>
        </div>
        <div className="iv-stat">
          <div className="iv-stat-label">Complete or mostly</div>
          <div className="iv-stat-value">{strong.toLocaleString()}</div>
          <div className="iv-stat-sub">
            {((strong / Math.max(stats.products, 1)) * 100).toFixed(0)}% of the collection
          </div>
        </div>
        <div className="iv-stat">
          <div className="iv-stat-label">Products with no pieces</div>
          <div className="iv-stat-value">{stats.productsWithoutPieces.toLocaleString()}</div>
          <div className="iv-stat-sub">Filter the list by “No pieces” to see them</div>
        </div>
        <div className="iv-stat">
          <div className="iv-stat-label">Unlinked pieces</div>
          <div className="iv-stat-value">{issues.toLocaleString()}</div>
          <div className="iv-stat-sub">
            {issues === 0 ? (
              'Every piece resolves to a product'
            ) : (
              <button className="iv-btn iv-btn--ghost iv-btn--sm" onClick={onInspectOrphans}>
                {stats.unassignedPieces} with no product, {stats.danglingPieces} dangling
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="iv-bars">
        <div className="iv-stat-label" style={{ marginBottom: 6 }}>
          Completeness
        </div>
        {stats.byCompleteness.map((bucket) => (
          <div className="iv-bar-row" key={bucket.value}>
            <Completeness value={bucket.value === 'Not set' ? null : bucket.value} />
            <div className="iv-bar-track">
              <div
                className="iv-bar-fill"
                style={{ width: `${(bucket.count / largest) * 100}%` }}
              />
            </div>
            <span className="iv-count" style={{ textAlign: 'right' }}>
              {bucket.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
