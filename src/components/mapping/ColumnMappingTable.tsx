import { ROLES, REQUIRED_ROLES } from '../../engine'
import type { ColumnMap, ColumnRole } from '../../types/columnMap'

interface ColumnMappingTableProps {
  headers: string[]
  columnMap: ColumnMap
  autoDetected: ColumnMap
  onChange: (role: ColumnRole, header: string | undefined) => void
}

export function ColumnMappingTable({ headers, columnMap, autoDetected, onChange }: ColumnMappingTableProps) {
  return (
    <div>
      {ROLES.map(({ role, label, hint }) => {
        const value = columnMap[role]
        const required = REQUIRED_ROLES.includes(role)
        const wasAuto = Boolean(autoDetected[role])
        const status = value ? 'matched' : required ? 'missing' : 'neutral'

        return (
          <div
            key={role}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line py-3 last:border-b-0"
          >
            <div className="font-display text-[15px] font-semibold text-ink">
              {label}
              {required && <span className="ml-1 text-danger">*</span>}
              {wasAuto && <span className="ml-2 text-[11px] font-bold text-ok">✓ auto</span>}
              {hint && <small className="block font-body text-[12.5px] font-normal text-mute">{hint}</small>}
            </div>
            <div className="text-violet" aria-hidden="true">
              →
            </div>
            <select
              value={value ?? ''}
              onChange={(e) => onChange(role, e.target.value || undefined)}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm text-ink ${
                status === 'matched' ? 'border-ok bg-ok-bg' : status === 'missing' ? 'border-warn bg-paper' : 'border-lilac-line bg-paper'
              }`}
            >
              <option value="">— não usar —</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}
