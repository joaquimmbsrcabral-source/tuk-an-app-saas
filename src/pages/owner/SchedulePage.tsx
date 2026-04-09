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
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  parseISO,
  isSameDay,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

export const OwnerSchedulePage: React.FC = () => {
  const { profile } = useAuth()
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [tuktuks, setTuktuks] = useState<TukTuk[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    driver_id: '',
    tuktuk_id: '',
    shift_date: '',
    start_time: '09:00',
    end_time: '18:00',
    notes: '',
  })

  useEffect(() => {
    if (profile) load()
  }, [profile, weekStart])

  const load = async () => {
    if (!profile) return
    setLoading(true)
    const start = format(weekStart, 'yyyy-MM-dd')
    const end = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')

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

  const days = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 1 }),
  })

  const openNew = (date: Date) => {
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
    if (error) {
      alert('Erro: ' + error.message)
      return
    }
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apagar este turno?')) return
    await supabase.from('shifts').delete().eq('id', id)
    load()
  }

  const driverName = (id: string) => drivers.find((d) => d.id === id)?.full_name || '?'
  const tuktukName = (id: string | null) => {
    if (!id) return null
    const t = tuktuks.find((x) => x.id === id)
    return t?.nickname || t?.plate || null
  }

  return (
    <OwnerLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Escala Semanal</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="p-2 border border-line rounded-btn">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-ink min-w-[180px] text-center capitalize">
              {format(weekStart, "dd 'de' MMM", { locale: ptPT })} —{' '}
              {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "dd 'de' MMM", { locale: ptPT })}
            </span>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-2 border border-line rounded-btn">
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-3 py-2 text-sm border border-line rounded-btn"
            >
              Hoje
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink2">A carregar…</div>
        ) : drivers.length === 0 ? (
          <Card>
            <p className="text-sm text-ink2">Convida motoristas primeiro para os escalares.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {days.map((d) => {
              const dayShifts = shifts.filter((s) => isSameDay(parseISO(s.shift_date), d))
              const isToday = isSameDay(d, new Date())
              return (
                <Card key={d.toISOString()} className={`min-h-[180px] ${isToday ? 'ring-2 ring-yellow' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-ink2 uppercase">{format(d, 'EEE', { locale: ptPT })}</p>
                      <p className="text-lg font-bold text-ink">{format(d, 'dd')}</p>
                    </div>
                    <button
                      onClick={() => openNew(d)}
                      className="bg-ink text-yellow rounded-full p-1 hover:translate-y-[-1px]"
                      title="Adicionar turno"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {dayShifts.length === 0 ? (
                      <p className="text-xs text-ink2">—</p>
                    ) : (
                      dayShifts.map((s) => (
                        <div key={s.id} className="bg-yellow bg-opacity-30 rounded p-2 text-xs group relative">
                          <p className="font-bold text-ink">{driverName(s.driver_id)}</p>
                          {s.start_at && s.end_at && (
                            <p className="text-ink2">
                              {format(parseISO(s.start_at), 'HH:mm')}-{format(parseISO(s.end_at), 'HH:mm')}
                            </p>
                          )}
                          {tuktukName(s.tuktuk_id) && <p className="text-ink2">🛺 {tuktukName(s.tuktuk_id)}</p>}
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-copper"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Turno">
        <div className="space-y-2">
          <Select
            label="Motorista"
            options={drivers.map((d) => ({ value: d.id, label: d.full_name }))}
            value={form.driver_id}
            onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
          />
          <Select
            label="TukTuk (opcional)"
            options={tuktuks.map((t) => ({ value: t.id, label: t.nickname || t.plate }))}
            value={form.tuktuk_id}
            onChange={(e) => setForm({ ...form, tuktuk_id: e.target.value })}
          />
          <Input
            label="Data"
            type="date"
            value={form.shift_date}
            onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Início"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <Input
              label="Fim"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>
          <TextArea
            label="Notas (opcional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} variant="primary" className="flex-1">
              Guardar
            </Button>
            <Button onClick={() => setModalOpen(false)} variant="ghost" className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
