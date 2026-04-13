import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Profile, Shift } from '../../lib/types'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  parseISO,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Check, User } from 'lucide-react'

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export const OwnerSchedulePage: React.FC = () => {
  const { profile } = useAuth()
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [month, setMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    if (profile) load()
  }, [profile, month])

  const load = async () => {
    if (!profile) return
    setLoading(true)

    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')

    const [{ data: ds }, { data: ss }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('role', 'driver'),
      supabase
        .from('shifts')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('shift_date', start)
        .lte('shift_date', end)
        .order('shift_date'),
    ])

    setDrivers(ds || [])
    setShifts(ss || [])
    setLoading(false)
  }

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  const shiftsForDay = (d: Date) =>
    shifts.filter((s) => isSameDay(parseISO(s.shift_date), d))

  const isDriverWorking = (driverId: string, day: Date) =>
    shifts.some((s) => s.driver_id === driverId && isSameDay(parseISO(s.shift_date), day))

  const toggleDriver = async (driverId: string, day: Date) => {
    if (!profile) return
    setToggling(driverId)

    const dateStr = format(day, 'yyyy-MM-dd')
    const working = isDriverWorking(driverId, day)

    if (working) {
      const shift = shifts.find(
        (s) => s.driver_id === driverId && isSameDay(parseISO(s.shift_date), day)
      )
      if (shift) {
        await supabase.from('shifts').delete().eq('id', shift.id)
        setShifts((prev) => prev.filter((s) => s.id !== shift.id))
      }
    } else {
      const { data } = await supabase
        .from('shifts')
        .insert([
          {
            company_id: profile.company_id,
            driver_id: driverId,
            tuktuk_id: null,
            shift_date: dateStr,
            start_at: `${dateStr}T09:00:00`,
            end_at: `${dateStr}T18:00:00`,
            notes: null,
          },
        ])
        .select()
        .single()
      if (data) {
        setShifts((prev) => [...prev, data])
      }
    }

    setToggling(null)
  }

  const selectedDayShifts = selectedDay ? shiftsForDay(selectedDay) : []

  return (
    <OwnerLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-ink">Escala Mensal</h1>
            <p className="text-sm text-ink2 mt-0.5">Clica num dia para gerir motoristas</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => { setMonth(subMonths(month, 1)); setSelectedDay(null) }}
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
              onClick={() => { setMonth(addMonths(month, 1)); setSelectedDay(null) }}
              className="w-9 h-9 flex items-center justify-center border border-line rounded-xl bg-card shadow-card hover:shadow-card-md transition-shadow text-ink2 hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => { setMonth(new Date()); setSelectedDay(null) }}
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
              <div className="w-16 h-16 rounded-2xl bg-cream border border-line flex items-center justify-center mb-4 shadow-card"><User size={28} className="text-ink" /></div>
              <h3 className="font-bold text-ink mb-1">Sem motoristas ainda</h3>
              <p className="text-sm text-ink2 max-w-xs">Convida motoristas primeiro na página Motoristas para os poderes escalar.</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Calendar */}
            <Card noPadding className="overflow-hidden">
              <div className="grid grid-cols-7 border-b border-line">
                {DAY_HEADERS.map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] font-bold text-ink2 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="grid grid-cols-7">
                  {[...Array(35)].map((_, i) => (
                    <div key={i} className="min-h-[52px] md:min-h-[80px] border-r border-b border-line last:border-r-0 p-2">
                      <div className="skeleton h-4 w-6 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {calendarDays.map((d, idx) => {
                    const dayShifts = shiftsForDay(d)
                    const inMonth = isSameMonth(d, month)
                    const todayDay = isToday(d)
                    const isSelected = selectedDay ? isSameDay(d, selectedDay) : false
                    const isLastInRow = (idx + 1) % 7 === 0
                    const isLastRow = idx >= calendarDays.length - 7

                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => inMonth && setSelectedDay(isSelected ? null : d)}
                        disabled={!inMonth}
                        className={`relative flex flex-col items-center justify-start pt-2 pb-1.5 border-b border-r border-line transition-colors min-h-[52px] md:min-h-[80px] ${
                          isLastInRow ? 'border-r-0' : ''
                        } ${isLastRow ? 'border-b-0' : ''} ${
                          isSelected
                            ? 'bg-ink'
                            : inMonth
                            ? 'bg-card active:bg-cream hover:bg-cream'
                            : 'bg-cream bg-opacity-60 cursor-default'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold ${
                            todayDay && !isSelected
                              ? 'bg-yellow text-ink'
                              : isSelected
                              ? 'text-yellow'
                              : inMonth
                              ? 'text-ink'
                              : 'text-muted'
                          }`}
                        >
                          {format(d, 'd')}
                        </span>

                        {dayShifts.length > 0 && inMonth && (
                          <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-1">
                            {dayShifts.slice(0, 3).map((s) => (
                              <span
                                key={s.id}
                                className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-yellow' : 'bg-ink'}`}
                              />
                            ))}
                            {dayShifts.length > 3 && (
                              <span className={`text-[9px] font-bold leading-none mt-0.5 ${isSelected ? 'text-yellow' : 'text-ink2'}`}>
                                +{dayShifts.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {dayShifts.length > 0 && inMonth && (
                          <span className={`hidden md:block text-[9px] font-bold mt-0.5 ${isSelected ? 'text-yellow' : 'text-ink2'}`}>
                            {dayShifts.length} mot.
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Day panel — driver toggles */}
            {selectedDay && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-ink capitalize">
                    {format(selectedDay, "d 'de' MMMM", { locale: ptPT })}
                  </h3>
                  <span className="text-xs text-ink2 bg-cream border border-line px-2.5 py-1 rounded-lg">
                    {selectedDayShifts.length} / {drivers.length} motoristas
                  </span>
                </div>

                <div className="space-y-2">
                  {drivers.map((driver) => {
                    const working = isDriverWorking(driver.id, selectedDay)
                    const isTogglingThis = toggling === driver.id

                    return (
                      <button
                        key={driver.id}
                        onClick={() => toggleDriver(driver.id, selectedDay)}
                        disabled={isTogglingThis}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          working
                            ? 'bg-yellow bg-opacity-15 border-yellow border-opacity-50'
                            : 'bg-cream border-line hover:border-ink2'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            working ? 'bg-ink text-yellow' : 'bg-line text-ink2'
                          }`}
                        >
                          {driver.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>

                        <span className={`flex-1 text-left text-sm font-semibold ${working ? 'text-ink' : 'text-ink2'}`}>
                          {driver.full_name}
                        </span>

                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isTogglingThis
                              ? 'bg-line animate-pulse'
                              : working
                              ? 'bg-ink'
                              : 'bg-line'
                          }`}
                        >
                          {working && !isTogglingThis && <Check size={12} className="text-yellow" />}
                          {!working && !isTogglingThis && <span className="w-2 h-0.5 bg-ink2 rounded-full block" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <p className="text-[11px] text-ink2 text-center mt-3">
                  Clica num motorista para adicionar ou remover · Horário: 09:00 – 18:00
                </p>
              </Card>
            )}
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
              <p className="text-2xl font-black text-ink">
                {new Set(shifts.map((s) => s.driver_id)).size}
              </p>
              <p className="text-xs text-ink2 mt-0.5">motoristas escalados</p>
            </div>

            <div className="bg-card border border-line rounded-xl p-4 shadow-card text-center">
              <p className="text-2xl font-black text-ink">
                {new Set(shifts.map((s) => s.shift_date)).size}
              </p>
              <p className="text-xs text-ink2 mt-0.5">dias com turnos</p>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  )
}
