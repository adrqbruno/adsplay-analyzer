import { useState } from 'react'
import type { Client } from '../../types/client'

interface ClientSwitcherProps {
  clients: Client[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string) => Promise<string>
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ClientSwitcher({ clients, selectedId, onSelect, onCreate, onRename, onDelete }: ClientSwitcherProps) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const selected = clients.find((c) => c.id === selectedId) ?? null

  async function submitCreate() {
    const name = newName.trim()
    if (!name) return
    const id = await onCreate(name)
    setNewName('')
    setCreating(false)
    onSelect(id)
  }

  if (creating) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void submitCreate()
        }}
      >
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome do cliente"
          className="w-48 rounded-xl border-2 border-lilac-line px-3 py-1.5 text-sm text-ink"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setCreating(false)
          }}
        />
        <button type="submit" className="rounded-full bg-violet px-4 py-1.5 font-display text-sm font-semibold text-white hover:bg-violet-deep">
          Criar
        </button>
        <button type="button" onClick={() => setCreating(false)} className="text-sm text-mute hover:text-ink">
          cancelar
        </button>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId ?? ''}
        onChange={(e) => (e.target.value ? onSelect(e.target.value) : undefined)}
        className="rounded-xl border-2 border-lilac-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink"
      >
        <option value="" disabled>
          Selecione um cliente
        </option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setCreating(true)}
        title="Novo cliente"
        className="grid size-8 place-items-center rounded-full border-2 border-lilac-line text-violet hover:border-violet"
      >
        +
      </button>

      {selected && (
        <>
          <button
            type="button"
            title="Renomear cliente"
            onClick={() => {
              const name = window.prompt('Novo nome do cliente', selected.name)
              if (name?.trim()) void onRename(selected.id, name)
            }}
            className="grid size-8 place-items-center rounded-full border-2 border-lilac-line text-mute hover:border-violet hover:text-violet"
          >
            ✎
          </button>
          <button
            type="button"
            title="Excluir cliente"
            onClick={() => {
              if (window.confirm(`Excluir "${selected.name}" e todo o histórico de análises dele? Essa ação não pode ser desfeita.`)) {
                void onDelete(selected.id)
              }
            }}
            className="grid size-8 place-items-center rounded-full border-2 border-lilac-line text-mute hover:border-danger hover:text-danger"
          >
            🗑
          </button>
        </>
      )}
    </div>
  )
}
