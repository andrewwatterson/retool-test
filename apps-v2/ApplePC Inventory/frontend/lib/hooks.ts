import { useCallback, useEffect, useRef, useState } from 'react'

/** Delay a fast-changing value — used so typing in a search box doesn't fire a
 *  query per keystroke against 2,400 products. */
export function useDebounced<T>(value: T, ms = 220): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return settled
}

/**
 * Re-run a backend function whenever its params change.
 *
 * The generated hooks expose an imperative `trigger`, and its identity isn't
 * guaranteed stable, so both it and the params are held in refs and the effect
 * keys off a serialized copy of the params instead.
 */
export function useAutoTrigger(
  trigger: (params?: Record<string, unknown>, options?: { skipCache?: boolean }) => unknown,
  params: Record<string, unknown>,
  enabled = true,
): { refetch: () => void } {
  const key = JSON.stringify(params)
  const triggerRef = useRef(trigger)
  const paramsRef = useRef(params)
  triggerRef.current = trigger
  paramsRef.current = params

  useEffect(() => {
    if (enabled) triggerRef.current(paramsRef.current)
  }, [key, enabled])

  // Bypasses the cache — for after a write, when the cached read is stale.
  const refetch = useCallback(() => {
    triggerRef.current(paramsRef.current, { skipCache: true })
  }, [])

  return { refetch }
}

/** Drag-to-resize width for the detail pane, clamped to sane bounds. */
export function useResizableWidth(initial: number, min = 320, max = 900) {
  const [width, setWidth] = useState(initial)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!dragging) return
    function onMove(e: MouseEvent) {
      // The pane is anchored right, so its width is the distance from the
      // pointer to the window edge.
      setWidth(Math.min(Math.max(window.innerWidth - e.clientX, min), max))
    }
    function onUp() {
      setDragging(false)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    // Stops the pointer from selecting text across the app mid-drag.
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [dragging, min, max])

  return { width, dragging, startDrag: () => setDragging(true) }
}
