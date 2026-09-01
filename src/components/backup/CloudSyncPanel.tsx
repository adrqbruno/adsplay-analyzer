import { useEffect, useState } from 'react'
import { type CloudClientSummary, listCloudClients, pullClientFromCloud, pushClientToCloud } from '../../db/cloudSync'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'
import type { Client } from '../../types/client'

interface CloudSyncPanelProps {
  client: Client
}

export function CloudSyncPanel({ client }: CloudSyncPanelProps) {
  const { enabled, session, loading, signInWithEmail, signOut } = useSupabaseAuth()
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushMessage, setPushMessage] = useState<string | null>(null)
  const [cloudClients, setCloudClients] = useState<CloudClientSummary[] | null>(null)
  const [cloudClientsError, setCloudClientsError] = useState<string | null>(null)
  const [pullBusyId, setPullBusyId] = useState<string | null>(null)
  const [pullMessage, setPullMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!session) return
    listCloudClients()
      .then((clients) => {
        setCloudClients(clients)
        setCloudClientsError(null)
      })
      .catch((err: unknown) => setCloudClientsError(err instanceof Error ? err.message : 'Falha ao listar clientes na nuvem.'))
  }, [session, refreshKey])

  if (!enabled || loading) return null

  async function handleSignIn() {
    setAuthError(null)
    const { error } = await signInWithEmail(email)
    if (error) setAuthError(error)
    else setMagicLinkSent(true)
  }

  async function handlePush() {
    setPushBusy(true)
    setPushMessage(null)
    try {
      const summary = await pushClientToCloud(client.id)
      setPushMessage(`Sincronizado: ${summary.uploads} upload(s), ${summary.analyses} análise(s).`)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setPushMessage(err instanceof Error ? err.message : 'Falha ao sincronizar.')
    } finally {
      setPushBusy(false)
    }
  }

  async function handlePull(cloudClientId: string) {
    setPullBusyId(cloudClientId)
    setPullMessage(null)
    try {
      const summary = await pullClientFromCloud(cloudClientId)
      setPullMessage(`Baixado: ${summary.uploads} upload(s), ${summary.analyses} análise(s).`)
    } catch (err) {
      setPullMessage(err instanceof Error ? err.message : 'Falha ao baixar.')
    } finally {
      setPullBusyId(null)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-lilac-line bg-paper p-5">
      <h3 className="mb-1 font-display text-base font-semibold text-ink">Sync com a nuvem (time)</h3>
      <p className="mb-4 text-sm text-mute">Opcional. Compartilha clientes, uploads e análises com o time via Supabase — nada aqui é automático.</p>

      {!session ? (
        <div>
          {!magicLinkSent ? (
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-64 rounded-xl border-2 border-lilac-line px-3 py-2 text-sm text-ink"
              />
              <button type="button" onClick={() => void handleSignIn()} className="rounded-full bg-violet px-5 py-2 font-display text-sm font-semibold text-white hover:bg-violet-deep">
                Enviar link de acesso
              </button>
            </div>
          ) : (
            <p className="text-sm text-ok">Link enviado para {email} — abra no seu e-mail para entrar.</p>
          )}
          {authError && <p className="mt-2 text-sm font-semibold text-danger">{authError}</p>}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-body">
              Conectado como <b>{session.user.email}</b>
            </span>
            <button type="button" onClick={() => void signOut()} className="font-display text-sm font-semibold text-violet hover:underline">
              Sair
            </button>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pushBusy}
              onClick={() => void handlePush()}
              className="rounded-full bg-violet px-5 py-2 font-display text-sm font-semibold text-white hover:bg-violet-deep disabled:cursor-not-allowed disabled:bg-lilac-line"
            >
              Sincronizar "{client.name}" agora
            </button>
            {pushMessage && <span className="text-sm text-ok">{pushMessage}</span>}
          </div>

          <div>
            <div className="mb-2 font-display text-sm font-semibold text-ink">Clientes na nuvem</div>
            {cloudClientsError && <p className="text-sm font-semibold text-danger">{cloudClientsError}</p>}
            {!cloudClients ? (
              <p className="text-sm text-mute">Carregando…</p>
            ) : cloudClients.length === 0 ? (
              <p className="text-sm text-mute">Nenhum cliente sincronizado ainda.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {cloudClients.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-xl border-2 border-lilac-line px-4 py-2.5">
                    <span className="text-sm text-ink">{c.name}</span>
                    <button
                      type="button"
                      disabled={pullBusyId === c.id}
                      onClick={() => void handlePull(c.id)}
                      className="text-sm font-semibold text-violet hover:underline disabled:opacity-50"
                    >
                      Baixar para este navegador
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {pullMessage && <p className="mt-2 text-sm text-ok">{pullMessage}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
