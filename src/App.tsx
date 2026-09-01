import { useEffect, useState } from 'react'
import { ClientSwitcher } from './components/clients/ClientSwitcher'
import { Nav } from './components/layout/Nav'
import { Workspace } from './components/layout/Workspace'
import { useClients } from './hooks/useClients'

const SELECTED_CLIENT_KEY = 'adsplay:selectedClientId'

function App() {
  const { clients, loading, createClient, renameClient, deleteClient } = useClients()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(() => localStorage.getItem(SELECTED_CLIENT_KEY))

  // Se o cliente selecionado foi excluído (ou nunca existiu), cai de volta pro primeiro disponível.
  const effectiveClientId = !loading && selectedClientId && !clients.some((c) => c.id === selectedClientId) ? (clients[0]?.id ?? null) : selectedClientId

  useEffect(() => {
    if (effectiveClientId) {
      localStorage.setItem(SELECTED_CLIENT_KEY, effectiveClientId)
    } else {
      localStorage.removeItem(SELECTED_CLIENT_KEY)
    }
  }, [effectiveClientId])

  const selectedClient = clients.find((c) => c.id === effectiveClientId) ?? null

  async function handleCreateClient(name: string) {
    const id = await createClient(name)
    setSelectedClientId(id)
    return id
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav
        right={
          !loading && (
            <ClientSwitcher
              clients={clients}
              selectedId={effectiveClientId}
              onSelect={setSelectedClientId}
              onCreate={handleCreateClient}
              onRename={renameClient}
              onDelete={deleteClient}
            />
          )
        }
      />

      {!selectedClient && (
        <header className="bg-gradient-to-b from-lilac to-paper px-7 py-13">
          <div className="mx-auto max-w-[1160px]">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-lilac-line bg-paper px-4 py-1.5 text-sm font-bold text-violet">
              <span className="size-1.5 rounded-full bg-violet" />
              Google Ads · Controle · Otimização · Experimento
            </span>
            <h1 className="max-w-[20ch] text-[clamp(30px,4.6vw,46px)] leading-[1.02] tracking-[-0.015em]">
              Suba o export da conta. <span className="text-violet">Receba o diagnóstico priorizado em R$.</span>
            </h1>
            <p className="mt-3.5 max-w-[60ch] text-lg text-body">
              A ferramenta lê a hierarquia inteira — conta, campanha, grupo, anúncio, keyword e termo — calcula os gargalos sobre os seus números e ordena tudo
              por quanto você recupera. Nada sai do seu navegador.
            </p>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-[1160px] flex-1 px-7 py-8">
        {loading ? null : selectedClient ? (
          <Workspace clientId={selectedClient.id} clientName={selectedClient.name} />
        ) : (
          <div className="rounded-[26px] border-2 border-lilac-line bg-paper p-9 text-center">
            <div className="mb-2 font-display text-xl font-semibold text-ink">Comece criando um cliente</div>
            <p className="mb-5 text-body">Cada cliente é um workspace separado, com seu próprio histórico de análises.</p>
            <ClientSwitcher
              clients={clients}
              selectedId={effectiveClientId}
              onSelect={setSelectedClientId}
              onCreate={handleCreateClient}
              onRename={renameClient}
              onDelete={deleteClient}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-lilac-line bg-lilac px-7 py-7 text-sm text-mute">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <span className="grid size-6 place-items-center rounded-full border-2 border-violet" />
            Adsplay<sup className="text-[9px] text-mute">®</sup>
          </div>
          <span>Analisador de campanha · framework controle · otimização · experimento</span>
        </div>
      </footer>
    </div>
  )
}

export default App
