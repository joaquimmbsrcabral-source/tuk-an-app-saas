import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { EmptyState } from '../../components/EmptyState'
import { Shift, TukTuk } from '../../lib/types'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, Truck } from 'lucide-react'

const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

export const DriverSchedulePage: React.FC = () => {
  const { profile } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [tuktuks, setTuktuks] = useState<Record<string, TukTuk>>({})
  const [month, setMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    if (profile) load()
  }, [profile, month])

  const load = async () => {
    if (!profile) return
    setLoading(true)
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')

    const [{ data: ss }, { data: tts }] = await Promise.all([
      supabase
        .from('shifts')
        .select('*')
        .eq('driver_id', profile.id)
        .gte('shift_date', start)
        .lte('shift_date', end)
        .order('shift_date'),
      supabase.from('tuktuks').select('*').eq('company_id', profile.company_id),
    ])
    setShifts(ss || [])
    const map: Record<string, TukTuk> = {}
    ;(tts || []).forEach((t) => (map[t.id] = t))
    setTuktuks(map)
    setLoading(false)
  }

  // Calendar grid: full weeks covering the month
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  const shiftsForDay = (d: Date) =>
    shifts.filter((s) => isSameDay(parseISO(s.shift_date), d))

  // Selected day's shifts
  const selectedShifts = selectedDay ? shiftsForDay(selectedDay) : null

  return (
    <DriverLayout>
      <div className="p-4 space-y-4 page-enter">
        {/* Header */}
        <div>
          <h1 className="text-xl font-black text-ink">A minha escala</h1>
          <p className="text-sm text-ink2 mt-0.5">Dias em que estás escalado para trabalhar</p>
        </div>

        {/* Calendar card */}
        <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <button
              onClick={() => { setMonth(subMonths(month, 1)); setSelectedDay(null) }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink2 hover:text-ink hover:bg-cream transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base font-bold text-ink capitalize">
              {format(month, 'MMMM yyyy', { locale: ptPT })}
            </h2>
            <button
              onClick={() => { setMonth(addMonths(month, 1)); setSelectedDay(null) }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink2 hover:text-ink hover:bg-cream transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-line px-2 pt-2 pb-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-muted uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5 px-2 py-2">
            {loading
              ? [...Array(35)].map((_, i) => (
                  <div key={i} className="aspect-square skeleton rounded-lg" />
                ))
              : calendarDays.map((d) => {
                  const dayShifts = shiftsForDay(d)
                  const hasShift = dayShifts.length > 0
                  const inMonth = isSameMonth(d, month)
                  const todayDay = isToday(d)
                  const isSelected = selectedDay && isSameDay(d, selectedDay)

                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => {
                        if (!inMonth) return
                        setSelectedDay(isSelected ? null : d)
                      }}
                      disabled={!inMonth}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 relative ${
                        !inMonth
                          ? 'opacity-25 cursor-default'
                          : isSelected
                          ? 'bg-ink text-yellow shadow-card-md scale-105'
                          : hasShift
                          ? 'bg-yellow text-ink font-bold shadow-card hover:scale-105'
                          : 'hover:bg-cream text-ink2 hover:text-ink'
                      } ${todayDay && !isSelected ? 'ring-2 ring-ink ring-offset-1' : ''}`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? 'text-yellow' : hasShift ? 'text-ink' : ''}`}>
                        {format(d, 'd')}
                      </span>
                      {hasShift && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-ink" />
                      )}
                      {hasShift && isSelected && (
                        <span className="w-1 h-1 rounded-full bg-yellow" />
                      )}
                    </button>
                  )
                })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-line">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-yellow border border-yellow border-opacity-50" />
              <span className="text-[10px] text-ink2 font-medium">Com turno</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border-2 border-ink" />
              <span className="text-[10px] text-ink2 font-medium">Hoje</span>
            </div>
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDay && selectedShifts && (
          <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-line bg-yellow bg-opacity-10">
              <h3 className="text-sm font-bold text-ink capitalize">
                {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptPT })}
              </h3>
            </div>
            {selectedShifts.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-ink2">Sem turno neste dia.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {selectedShifts.map((s) => (
                  <div key={s.id} className="px-4 py-3">
                    {s.start_at && s.end_at && (
                      <div className="flex items-center gap-2 text-sm text-ink mb-1">
                        <Clock size={14} className="text-ink2" />
                        <span className="font-semibold">
                          {format(parseISO(s.start_at), 'HH:mm')} — {format(parseISO(s.end_at), 'HH:mm')}
                        </span>
                      </div>
                    )}
                    {s.tuktuk_id && tuktuks[s.tuktuk_id] && (
                      <div className="flex items-center gap-2 text-sm text-ink2">
                        <Truck size={14} />
                        <span>{tuktuks[s.tuktuk_id].nickname || tuktuks[s.tuktuk_id].plate}</span>
                      </div>
                    )}
                    {s.notes && (
                      <p className="text-xs text-ink2 mt-2 bg-cream rounded-lg px-3 py-2 border border-line">
                        {s.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Monthly shift list */}
        {!loading && !selectedDay && (
          <>
            {shifts.length === 0 ? (
              <EmptyState
                icon="📅"
                title="Sem turnos este mês"
                description="O teu owner ainda não te escalou para nenhum dia este mês."
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Turnos do mês</h3>
                  <span className="text-xs text-ink2 bg-card border border-line px-2 py-1 rounded-lg shadow-card">
                    {shifts.length} {shifts.length === 1 ? 'turno' : 'turnos'}
                  </span>
                </div>
                {shifts.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedDay(parseISO(s.shift_date))}
                    className="w-full bg-card border border-line rounded-xl shadow-card hover:shadow-card-md transition-all duration-150 px-4 py-3 text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-ink capitalize">
                          {format(parseISO(s.shift_date), "EEEE, d 'de' MMM", { locale: ptPT })}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {s.start_at && s.end_at && (
                            <span className="flex items-center gap-1 text-xs text-ink2">
                              <Clock size={11} />
                              {format(parseISO(s.start_at), 'HH:mm')}–{format(parseISO(s.end_at), 'HH:mm')}
                            </span>
                          )}
                          {s.tuktuk_id && tuktuks[s.tuktuk_id] && (
                            <span className="flex items-center gap-1 text-xs text-ink2">
                              🛺 {tuktuks[s.tuktuk_id].nickname || tuktuks[s.tuktuk_id].plate}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${isToday(parseISO(s.shift_date)) ? 'bg-yellow' : 'bg-line'} group-hover:bg-yellow transition-colors`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DriverLayout>
  )
}
