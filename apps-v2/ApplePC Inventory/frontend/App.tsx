// App.tsx is written last: the dev server resolves imports on each write, so
// its dependencies (pages, hooks) must exist first.

import { useState } from 'react'
import './orgTheme.css'
import './app.css'
import { Products } from './pages/Products'
import { Pieces } from './pages/Pieces'
import { NewProduct } from './pages/NewProduct'
import { Overview } from './pages/Overview'

type View = 'products' | 'pieces' | 'new' | 'overview'

const TABS: Array<{ id: View; label: string }> = [
  { id: 'products', label: 'Products' },
  { id: 'pieces', label: 'Pieces' },
  { id: 'new', label: 'New product' },
  { id: 'overview', label: 'Overview' },
]

export default function App() {
  const [view, setView] = useState<View>('products')
  // Held here rather than inside Products so that saving a new product can
  // switch views and open it in the detail pane in one step.
  const [selected, setSelected] = useState('')
  // Bumping this remounts Pieces with the unlinked-pieces view already on.
  const [orphanNonce, setOrphanNonce] = useState(0)

  return (
    <div className="iv-app">
      <header className="iv-header">
        <div className="iv-wordmark">
          Collection<span>Inventory</span>
        </div>
        <nav className="iv-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              aria-current={view === tab.id ? 'page' : undefined}
              onClick={() => setView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {view === 'products' && (
        <Products
          selected={selected}
          onSelect={setSelected}
          onNewProduct={() => setView('new')}
        />
      )}

      {view === 'pieces' && <Pieces key={orphanNonce} startOnOrphans={orphanNonce > 0} />}

      {view === 'new' && (
        <NewProduct
          onCreated={(uuid) => {
            setSelected(uuid)
            setView('products')
          }}
        />
      )}

      {view === 'overview' && (
        <Overview
          onInspectOrphans={() => {
            setOrphanNonce((n) => n + 1)
            setView('pieces')
          }}
        />
      )}
    </div>
  )
}
