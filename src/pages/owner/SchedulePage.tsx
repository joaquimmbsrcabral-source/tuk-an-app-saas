import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, Select, TextArea } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { Profile, TukTuk, Shift } from '../../lib/types'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths,
  parseISO, isSameDay, isSameMonth, isToday,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export const OwnerSchedulePage: React.FC = () => {
  const { profile } = useAuth()
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [tuktuks, setTuktuks] = useState<TukTuk[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [month, setMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [mobileViewDay, setMobileViewDay] = useState<Date | null>(null)
  const [form, setForm] = useState({
    driver_id: '',
    tuktuk_id: '',
    shift_date: '',
    start_time: '09:00',
    end_time: '18:00',
    notes: '',
  })

  useEffect(() => { if (profile) load() }, [profile, month])

  const load = async () => {
    if (!profile) return
    setLoading(true)
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')
    const [{ data: ds }, { data: tts }, { data: ss }] = await Promise.all([
      supabase.from('profiles').select('*').eq('company_id', profile.company_id).eq('role', 'driver'),
      supabase.from('tuktuks').select('*').eq('company_id', profile.company_id),
      supabase
        .from('shifts')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('shift_date', start)
        .lte('shift_date', end)
        .order('shift_date'),
    ])
    setDrivers(ds || [])
    setTuktuks(tts || [])
    setShifts(ss || [])
    setLoading(false)
  }

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  const shiftsForDay = (d: Date) => shifts.filter((s) => isSameDay(parseISO(s.shift_date), d))

  const openNew = (date: Date) => {
    setSelectedDay(date)
    setForm({
      driver_id: drivers[0]?.id || '',
      tuktuk_id: tuktuks[0]?.id || '',
      shift_date: format(date, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '18:00',
      notes: '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!profile || !form.driver_id || !form.shift_date) {
      alert('Escolhe motorista e data.')
      return
    }
    setSaving(true)
    const start_at = `${form.shift_date}T${form.start_time}:00`
    const end_at = `${form.shift_date}T${form.end_time}:00`
    const { error } = await supabase.from('shifts').insert([
      {
        company_id: profile.company_id,
        driver_id: form.driver_id,
        tuktuk_id: form.tuktuk_id || null,
        shift_date: form.shift_date,
        start_at,
        end_at,
        notes: form.notes || null,
      },
    ])
    setSaving(false)
    if (error) { alert('Erro: ' + error.message); return }
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apagar este turno?')) return
    await supabase.from('shifts').delete().eq('id', id)
    load()
  }

  const driverName = (id: string) => drivers.find((d) => d.id === id)?.full_name || '?'
  const tuktukLabel = (id: string | null) => {
    if (!id) return null
    const t = tuktuks.find((x) => x.id === id)
    return t?.nickname || t?.plate || null
  }

  const mobileViewShifts = mobileViewDay ? shiftsForDay(mobileViewDay) : []

  return (
    <OwnerLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-ink">Escala Mensal</h1>
            <p className="text-sm text-ink2 mt-0.5">Gerir turnos e atribuições de motoristas</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setMonth(subMonths(month, 1))}
              className="w-9 h-9 flex items-center justify-center border border-line rounded-xl bg-card shadow-card hover:shadow-card-md transition-shadow text-ink2 hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center min-w-[130px] sm:min-w-[160px]">
              <span className="text-sm sm:text-base font-bold text-ink capitalize">
                {format(month, 'MMMM yyyy', { locale: ptPT })}
              </span>
            </div>
            <button
              onClick={() => setMonth(addMonths(month, 1))}
              className="w-9 h-9 flex items-center justify-center border border-line rounded-xl bg-card shadow-card hover:shadow-card-md transition-shadow text-ink2 hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setMonth(new Date())}
              className="px-3 py-2 text-xs font-bold border border-line rounded-xl bg-card shadow-card hover:shadow-card-md transition-shadow text-ink2 hover:text-ink"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* No drivers */}
        {!loading && drivers.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cream border border-line flex items-center justify-center text-3xl mb-4 shadow-card">👤</div>
              <h3 className="font-bold text-ink mb-1">Sem motoristas ainda</h3>
              <p className="text-sm text-ink2 max-w-xs">Convida motoristas primeiro na página Motoristas para os poderes escalar.</p>
            </div>
          </Card>
        ) : (
          <>
            {/* ── MOBILE compact calendar ─────────────────────── */}
            <div className="md:hidden">
              <Card noPadding className="overflow-hidden">
                <div className="grid grid-cols-7 border-b border-line">
                  {DAY_HEADERS.map((d) => (
                    <div key={d} className="py-2 text-center text-[10px] font-bold text-ink2 uppercase tracking-wider">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((d, idx) => {
                    const dayShifts = shiftsForDay(d)
                    const inMonth = isSameMonth(d, month)
                    const todayDay = isToday(d)
                    const isSelected = mobileViewDay ? isSameDay(d, mobileViewDay) : false
                    const isLastInRow = (idx + 1) % 7 === 0
                    const isLastRow = idx >= calendarDays.length - 7
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => setMobileViewDay(isSelected ? null : d)}
                        className={`relative flex flex-col items-center justify-center py-2 border-b border-r border-line transition-colors ${isLastInRow ? 'border-r-0' : ''} ${isLastRow ? 'border-b-0' : ''} ${isSelected ? 'bg-ink' : inMonth ? 'bg-card active:bg-cream' : 'bg-cream bg-opacity-60'}`}
                      >
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${todayDay && !isSelected ? 'bg-yellow text-ink' : isSelected ? 'text-yellow' : inMonth ? 'text-ink' : 'text-muted'}`}>
                          {format(d, 'd')}
                        </span>
                        {dayShifts.length > 0 && (
                          <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-yellow' : 'bg-ink'}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </Card>

              {mobileViewDay && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-ink text-sm">
                      {format(mobileViewDay, "d 'de' MMMM", { locale: ptPT })}
                    </h3>
                    <button
                      onClick={() => openNew(mobileViewDay)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-yellow rounded-xl text-xs font-bold"
                    >
                      <Plus size={12} />
                      Turno
                    </button>
                  </div>
                  {mobileViewShifts.length === 0 ? (
                    <p className="text-sm text-ink2 text-center py-6">Nenhum turno neste dia</p>
                  ) : (
                    <div className="space-y-2">
                      {mobileViewShifts.map((s) => (
                        <div key={s.id} className="bg-card border border-line rounded-xl p-3 flex items-start justify-between shadow-card">
                          <div>
                            <p className="font-bold text-sm text-ink">{driverName(s.driver_id)}</p>
                            {s.start_at && s.end_at && (
                              <p className="text-xs text-ink2 mt-0.5">{format(parseISO(s.start_at), 'HH:mm')} – {format(parseISO(s.end_at), 'HH:mm')}</p>
                            )}
                            {tuktukLabel(s.tuktuk_id) && (
                              <p className="text-xs text-ink2">🛺 {tuktukLabel(s.tuktuk_id)}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="w-8 h-8 flex items-center justify-center text-copper hover:bg-cream rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── DESKTOP full calendar ───────────────────────── */}
            <Card noPadding className="overflow-hidden hidden md:block">
              <div className="grid grid-cols-7 border-b border-line">
                {DAY_HEADERS.map((d) => (
                  <div key={d} className="py-2.5 text-center text-xs font-bold text-ink2 uppercase tracking-wider">{d}</div>
                ))}
              </div>
              {loading ? (
                <div className="grid grid-cols-7">
                  {[...Array(35)].map((_, i) => (
                    <div key={i} className="min-h-[100px] border-r border-b border-line last:border-r-0 p-2">
                      <div className="skeleton h-4 w-6 mb-2 rounded" />
                      <div className="skeleton h-8 w-full rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {calendarDays.map((d, idx) => {
                    const dayShifts = shiftsForDay(d)
                    const inCurrentMonth = isSameMonth(d, month)
                    const todayDay = isToday(d)
                    const isLastInRow = (idx + 1) % 7 === 0
                    const isLastRow = idx >= calendarDays.length - 7
                    return (
                      <div
                        key={d.toISOString()}
                        className={`min-h-[110px] border-b border-r border-line relative group transition-colors ${isLastInRow ? 'border-r-0' : ''} ${isLastRow ? 'border-b-0' : ''} ${inCurrentMonth ? 'bg-card' : 'bg-cream bg-opacity-60'} ${todayDay ? 'bg-yellow bg-opacity-5' : ''}`}
                      >
                        <div className="flex items-center justify-between px-2 pt-2 pb-1">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${todayDay ? 'bg-ink text-yellow' : inCurrentMonth ? 'text-ink' : 'text-muted'}`}>
                            {format(d, 'd')}
                          </span>
                          {inCurrentMonth && (
                            <button
                              onClick={() => openNew(d)}
                              className="w-5 h-5 rounded-full bg-ink text-yellow flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                              title="Adicionar turno"
                            >
                              <Plus size={10} />
                            </button>
                          )}
                        </div>
                        <div className="px-1.5 pb-1.5 space-y-1 overflow-hidden">
                          {dayShifts.slice(0, 3).map((s) => (
                            <div key={s.id} className="relative group/shift bg-yellow bg-opacity-25 border border-yellow border-opacity-40 rounded-md px-1.5 py-1 text-[10px] leading-tight">
                              <p className="font-bold text-ink truncate">{driverName(s.driver_id)}</p>
                              {s.start_at && s.end_at && (
                                <p className="text-ink2">{format(parseISO(s.start_at), 'HH:mm')}–{format(parseISO(s.end_at), 'HH:mm')}</p>
                              )}
                              {tuktukLabel(s.tuktuk_id) && <p className="text-ink2">🛺 {tuktukLabel(s.tuktuk_id)}</p>}
                              <button
                                onClick={() => handleDelete(s.id)}
                                className="absolute top-0.5 right-0.5 opacity-0 group-hover/shift:opacity-100 text-copper hover:scale-110 transition-all"
                                title="Apagar turno"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                          {dayShifts.length > 3 && (
                            <p className="text-[10px] text-ink2 font-medium px-1">+{dayShifts.length - 3} mais</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Monthly summary */}
        {!loading && shifts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-line rounded-xl p-4 shadow-card text-center">
              <p className="text-2xl font-black text-ink">{shifts.length}</p>
              <p className="text-xs text-ink2 mt-0.5">turnos este mês</p>
            </div>
            <div className="bg-card border border-line rounded-xl p-4 shadow-card text-center">
              <p className="text-2xl font-black text-ink">{new Set(shifts.map((s) => s.driver_id)).size}</p>
              <p className="text-xs text-ink2 mt-0.5">motoristas escalados</p>
            </div>
            <div className="bg-card border border-line rounded-xl p-4 shadow-card text-center">
              <p className="text-2xl font-black text-ink">{new Set(shifts.map((s) => s.shift_date)).size}</p>
              <p className="text-xs text-ink2 mt-0.5">dias com turnos</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Turno">
        <div className="space-y-3">
          <Select
            label="Motorista"
            options={drivers.map((d) => ({ value: d.id, label: d.full_name }))}
            value={form.driver_id}
            onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
          />
          <Select
            label="TukTuk (opcional)"
            options={[{ value: '', label: '— Nenhum —' }, ...tuktuks.map((t) => ({ value: t.id, label: t.nickname || t.plate }))]}
            value={form.tuktuk_id}
            onChange={(e) => setForm({ ...form, tuktuk_id: e.target.value })}
          />
          <Input label="Data" type="date" value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Início" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="Fim" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <TextArea label="Notas (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} variant="primary" className="flex-1" loading={saving}>Guardar Turno</Button>
            <Button onClick={() => setModalOpen(false)} variant="ghost" className="flex-1">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
