import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import type { Institution } from "@/types"
import { institutionLabel, matchesInstitution, primaryAbbreviation } from "@/lib/institutionSearch"

interface CampusComboboxProps {
  institutions: Institution[]
  value: number | null
  onChange: (id: number | null) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

// Dropdown kampus yang bisa dicari berdasarkan nama, lokasi, atau singkatan (mis. "ITB").
// Panel dropdown di-render via portal ke document.body agar tidak terpotong oleh
// ancestor yang memiliki overflow:hidden / stacking context.
export function CampusCombobox({
  institutions,
  value,
  onChange,
  placeholder = "-- Pilih Kampus --",
  searchPlaceholder = "Cari kampus / singkatan (mis. ITB)...",
  className,
  disabled,
}: CampusComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [rect, setRect] = React.useState<{ top: number; left: number; width: number } | null>(null)

  const selected = React.useMemo(
    () => institutions.find((i) => i.id === value) || null,
    [institutions, value]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim()
    if (!q) return institutions
    return institutions.filter((i) => matchesInstitution(i, q))
  }, [institutions, query])

  // Reposisi panel saat open (resize/scroll)
  React.useEffect(() => {
    if (!open) return
    const update = () => {
      if (rootRef.current) {
        const r = rootRef.current.getBoundingClientRect()
        setRect({ top: r.bottom + 4, left: r.left, width: r.width })
      }
    }
    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [open])

  // Tutup saat klik di luar trigger & panel
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  React.useEffect(() => {
    if (open) setQuery("")
  }, [open])

  const select = (id: number | null) => {
    onChange(id)
    setOpen(false)
  }

  const toggle = () => {
    if (disabled) return
    if (!open && rootRef.current) {
      const r = rootRef.current.getBoundingClientRect()
      setRect({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen((o) => !o)
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border border-slate-200 dark:border-border text-sm text-left focus:outline-none focus:border-primary dark:text-white transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
          !selected && "text-slate-400 dark:text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selected ? institutionLabel(selected) : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && rect && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}
          className="rounded-xl border border-slate-200 dark:border-border bg-card shadow-xl overflow-hidden"
        >
          <div className="relative p-2 border-b border-slate-100 dark:border-border">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-auto py-2 rounded-lg"
            />
            {selected && (
              <button
                type="button"
                onClick={() => select(null)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Bersihkan pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">Tidak ada kampus ditemukan.</p>
            ) : (
              filtered.map((inst) => {
                const abbr = primaryAbbreviation(inst)
                const isSel = inst.id === value
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => select(inst.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors",
                      isSel && "bg-primary/5"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-700 dark:text-slate-200">
                        {inst.name}
                        {abbr ? <span className="text-slate-400 font-normal"> ({abbr})</span> : null}
                      </span>
                    </span>
                    {isSel && <Check className="w-4 h-4 shrink-0 text-primary" />}
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}