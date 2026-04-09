import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { formatCurrency, formatDate } from '../../lib/format'
import { ArrowLeft, Upload, FileText, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, format, isSameDay } from 'date-fns'
import { pt } from 'date-fns/locale'

interface TukTukDoc {
  id: string
  kind: string
  file_name: string
  file_path: string
  expires_at: string | null
  created_at: string
}

export const TukTukDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [tuktuk, setTuktuk] = useState<any>(null)
  const [docs, setDocs] = useState<TukTukDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docKind, setDocKind] = useState('seguro')
  const [docExpires, setDocExpires] = useState('')
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [weekData, setWeekData] = useState<Record<string, { drivers: Set<string>; revenue: number; driverNames: string[] }>>({})
  const [editingDates, setEditingDates] = useState(false)
  const [dateForm, setDateForm] = useState({ insurance_expiry: '', inspection_expiry: '', last_service_date: '', km: 0, next_service_km: 0 })

  useEffect(() => {
    if (profile && id) {
      fetchAll()
    }
  }, [profile, id, weekStart])

  const fetchAll = async () => {
    if (!profile || !id) return
    setLoading(true)
    try {
      const { data: tk } = await supabase.from('tuktuks').select('*').eq('id', id).single()
      setTuktuk(tk)
      setDateForm({
        insurance_expiry: tk?.insurance_expiry || '',
        inspection_expiry: tk?.inspection_expiry || '',
        last_service_date: tk?.last_service_date || '',
        km: tk?.km || 0,
        next_service_km: tk?.next_service_km || 0,
      })

      const { data: d } = await supabase
        .from('tuktuk_documents')
        .select('*')
        .eq('tuktuk_id', id)
        .order('created_at', { ascending: false })
      setDocs(d || [])

      // Week data: bookings + street_sales + drivers per day
      const from = weekStart.toISOString()
      const to = endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString()
      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_at, price, driver_id, profiles!bookings_driver_id_fkey(full_name)')
        .eq('tuktuk_id', id)
        .gte('start_at', from)
        .lte('start_at', to)
      const { data: sales } = await supabase
        .from('street_sales')
        .select('sold_at, price, driver_id, profiles!street_sales_driver_id_fkey(full_name)')
        .eq('tuktuk_id', id)
        .gte('sold_at', from)
        .lte('sold_at', to)

      const days: Record<string, { drivers: Set<string>; revenue: number; driverNames: string[] }> = {}
      eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) }).forEach((d) => {
        days[format(d, 'yyyy-MM-dd')] = { drivers: new Set(), revenue: 0, driverNames: [] }
      })
      ;(bookings || []).forEach((b: any) => {
        const k = format(new Date(b.start_at), 'yyyy-MM-dd')
        if (!days[k]) return
        days[k].revenue += Number(b.price || 0)
        if (b.driver_id && !days[k].drivers.has(b.driver_id)) {
          days[k].drivers.add(b.driver_id)
          days[k].driverNames.push(b.profiles?.full_name || '—')
        }
      })
      ;(sales || []).forEach((s: any) => {
        const k = format(new Date(s.sold_at), 'yyyy-MM-dd')
        if (!days[k]) return
        days[k].revenue += Number(s.price || 0)
        if (s.driver_id && !days[k].drivers.has(s.driver_id)) {
          days[k].drivers.add(s.driver_id)
          days[k].driverNames.push(s.profiles?.full_name || '—')
        }
      })
      setWeekData(days)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile || !id) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.company_id}/${id}/${Date.now()}-${docKind}.${ext}`
      const { error: upErr } = await supabase.storage.from('tuktuk-docs').upload(path, file)
      if (upErr) throw upErr
      await supabase.from('tuktuk_documents').insert([{
        company_id: profile.company_id,
        tuktuk_id: id,
        kind: docKind,
        file_name: file.name,
        file_path: path,
        expires_at: docExpires || null,
        uploaded_by: profile.id,
      }])
      setDocExpires('')
      await fetchAll()
    } catch (err: any) {
      alert('Erro no upload: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDownload = async (doc: TukTukDoc) => {
    const { data } = await supabase.storage.from('tuktuk-docs').createSignedUrl(doc.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleDeleteDoc = async (doc: TukTukDoc) => {
    if (!window.confirm('Apagar este documento?')) return
    await supabase.storage.from('tuktuk-docs').remove([doc.file_path])
    await supabase.from('tuktuk_documents').delete().eq('id', doc.id)
    await fetchAll()
  }

  const saveDates = async () => {
    if (!id) return
    await supabase.from('tuktuks').update(dateForm).eq('id', id)
    setEditingDates(false)
    await fetchAll()
  }

  if (loading || !tuktuk) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  const today = new Date()
  const insuranceExpiringSoon = tuktuk.insurance_expiry && new Date(tuktuk.insurance_expiry) < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const inspectionExpiringSoon = tuktuk.inspection_expiry && new Date(tuktuk.inspection_expiry) < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const weekTotal = Object.values(weekData).reduce((s, d) => s + d.revenue, 0)

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <button onClick={() => navigate('/frota')} className="flex items-center gap-2 text-ink2 hover:text-ink">
          <ArrowLeft size={18} /> Voltar à Frota
        </button>

        <div className="flex items-center gap-4">
          <div className="text-6xl">🛺</div>
          <div>
            <h1 className="text-3xl font-bold text-ink">{tuktuk.nickname}</h1>
            <p className="text-ink2">Matrícula: {tuktuk.plate} · {tuktuk.color}</p>
          </div>
        </div>

        {/* Dates card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Documentos & Datas</h2>
            <Button variant="ghost" size="sm" onClick={() => setEditingDates(!editingDates)}>
              {editingDates ? 'Cancelar' : 'Editar'}
            </Button>
          </div>
          {editingDates ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink2">Seguro expira</label>
                <input type="date" value={dateForm.insurance_expiry} onChange={(e) => setDateForm({ ...dateForm, insurance_expiry: e.target.value })} className="w-full px-3 py-2 border border-line rounded-btn" />
              </div>
              <div>
                <label className="text-xs text-ink2">Inspeção expira</label>
                <input type="date" value={dateForm.inspection_expiry} onChange={(e) => setDateForm({ ...dateForm, inspection_expiry: e.target.value })} className="w-full px-3 py-2 border border-line rounded-btn" />
              </div>
              <div>
                <label className="text-xs text-ink2">Última revisão</label>
                <input type="date" value={dateForm.last_service_date} onChange={(e) => setDateForm({ ...dateForm, last_service_date: e.target.value })} className="w-full px-3 py-2 border border-line rounded-btn" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ink2">KM atual</label>
                  <input type="number" value={dateForm.km} onChange={(e) => setDateForm({ ...dateForm, km: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-line rounded-btn" />
                </div>
                <div>
                  <label className="text-xs text-ink2">Próxima revisão (KM)</label>
                  <input type="number" value={dateForm.next_service_km} onChange={(e) => setDateForm({ ...dateForm, next_service_km: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-line rounded-btn" />
                </div>
              </div>
              <Button variant="primary" onClick={saveDates} className="w-full">Guardar</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-ink2">Seguro</div>
                <div className={`font-semibold ${insuranceExpiringSoon ? 'text-copper' : 'text-ink'}`}>
                  {tuktuk.insurance_expiry ? formatDate(tuktuk.insurance_expiry) : '—'}
                  {insuranceExpiringSoon && <AlertCircle size={14} className="inline ml-1" />}
                </div>
              </div>
              <div>
                <div className="text-ink2">Inspeção</div>
                <div className={`font-semibold ${inspectionExpiringSoon ? 'text-copper' : 'text-ink'}`}>
                  {tuktuk.inspection_expiry ? formatDate(tuktuk.inspection_expiry) : '—'}
                  {inspectionExpiringSoon && <AlertCircle size={14} className="inline ml-1" />}
                </div>
              </div>
              <div>
                <div className="text-ink2">Última revisão</div>
                <div className="font-semibold text-ink">{tuktuk.last_service_date ? formatDate(tuktuk.last_service_date) : '—'}</div>
              </div>
              <div>
                <div className="text-ink2">KM / Próxima revisão</div>
                <div className="font-semibold text-ink">{tuktuk.km} / {tuktuk.next_service_km}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Documents */}
        <Card>
          <h2 className="text-lg font-bold text-ink mb-4">Ficheiros</h2>
          <div className="bg-cream p-3 rounded-btn mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select value={docKind} onChange={(e) => setDocKind(e.target.value)} className="px-3 py-2 border border-line rounded-btn text-sm bg-white">
                <option value="seguro">Seguro</option>
                <option value="inspecao">Inspeção</option>
                <option value="revisao">Revisão</option>
                <option value="livrete">Livrete</option>
                <option value="iuc">IUC</option>
                <option value="outro">Outro</option>
              </select>
              <input type="date" value={docExpires} onChange={(e) => setDocExpires(e.target.value)} placeholder="Expira em" className="px-3 py-2 border border-line rounded-btn text-sm" />
            </div>
            <label className="flex items-center justify-center gap-2 w-full py-3 bg-yellow text-ink font-semibold rounded-btn cursor-pointer hover:opacity-90">
              <Upload size={18} />
              {uploading ? 'A carregar…' : 'Fazer upload'}
              <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" accept="image/*,application/pdf" />
            </label>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-ink2 text-center py-4">Sem ficheiros ainda.</p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 border border-line rounded-btn">
                  <FileText size={20} className="text-ink2" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink text-sm truncate">{d.file_name}</div>
                    <div className="text-xs text-ink2">
                      {d.kind} {d.expires_at && `· expira ${formatDate(d.expires_at)}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(d)}>Abrir</Button>
                  <button onClick={() => handleDeleteDoc(d)} className="text-copper p-1"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Weekly calendar */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Semana</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="p-2 hover:bg-cream rounded-btn"><ChevronLeft size={18} /></button>
              <span className="text-sm text-ink2 min-w-[140px] text-center">
                {format(weekStart, 'd MMM', { locale: pt })} – {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'd MMM', { locale: pt })}
              </span>
              <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-2 hover:bg-cream rounded-btn"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(weekData).map(([dateStr, data]) => {
              const d = new Date(dateStr)
              const isToday = isSameDay(d, new Date())
              return (
                <div key={dateStr} className={`p-3 rounded-btn border ${isToday ? 'border-yellow bg-yellow bg-opacity-10' : 'border-line bg-cream'}`}>
                  <div className="text-xs text-ink2 uppercase">{format(d, 'EEE', { locale: pt })}</div>
                  <div className="text-lg font-bold text-ink mb-2">{format(d, 'd')}</div>
                  {data.driverNames.length > 0 && (
                    <div className="text-xs text-ink mb-1 truncate" title={data.driverNames.join(', ')}>
                      {data.driverNames[0].split(' ')[0]}{data.driverNames.length > 1 && ` +${data.driverNames.length - 1}`}
                    </div>
                  )}
                  <div className="text-sm font-semibold text-green">{data.revenue > 0 ? formatCurrency(data.revenue) : '—'}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
            <span className="text-sm text-ink2">Total da semana</span>
            <span className="text-xl font-bold text-green">{formatCurrency(weekTotal)}</span>
          </div>
        </Card>
      </div>
    </OwnerLayout>
  )
}
