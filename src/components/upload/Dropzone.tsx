import { useState } from 'react'

interface DropzoneProps {
  onFile: (file: File) => void
}

export function Dropzone({ onFile }: DropzoneProps) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <label
      className={`block cursor-pointer rounded-[20px] border-2 border-dashed px-6 py-11 text-center transition-colors ${
        dragOver ? 'border-violet bg-lilac' : 'border-lilac-line bg-paper-2 hover:border-violet hover:bg-lilac'
      }`}
      onDragEnter={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault()
        setDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) onFile(file)
      }}
    >
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-[18px] bg-violet text-white">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5-5 5 5" />
          <path d="M12 5v13" />
        </svg>
      </span>
      <span className="mb-1.5 block font-display text-xl font-semibold text-ink">
        Arraste o arquivo aqui ou clique para selecionar
      </span>
      <span className="block text-sm text-mute">CSV exportado do Google Ads · com todos os níveis num arquivo só</span>
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </label>
  )
}
