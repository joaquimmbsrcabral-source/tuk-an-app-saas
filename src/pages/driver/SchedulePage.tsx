import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
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
  format,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const DriverSchedulePage: React.FC = () => {
  const { profile } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [tuktuks, setTuktuks] = useState<Record<string, TukTuk>>({})
  const [month, setMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

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

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  const shiftsForDay = (d: Date) =>
    shifts.filter((s) => isSameDay(parseISO(s.shift_date), d))

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-ink">A minha escala</h1>
        <p className="text-sm text-ink2">Os dias em que estás escalado para trabalhar.</p>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMonth(subMonths(month, 1))} className="text-ink2 hover:text-ink">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-ink capitalize">
              {format(month, 'MMMM yyyy', { locale: ptPT })}
            </h2>
            <button onClick={() => setMonth(addMonths(month, 1))} className="text-ink2 hover:text-ink">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink2 mb-1">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
              <div key={i} className="font-bold">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const ds = shiftsForDay(d)
              const has = ds.length > 0
              const inMonth = isSameMonth(d, month)
              const isToday = isSameDay(d, new Date())
              return (
                <div
                  key={d.toISOString()}
                  className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start text-xs border ${
                    has ? 'bg-yellow border-yellow' : 'bg-cream border-line'
                  } ${!inMonth ? 'opacity-30' : ''} ${isToday ? 'ring-2 ring-ink' : ''}`}
                >
                  <span className={`font-bold ${has ? 'text-ink' : 'text-ink2'}`}>
                    {format(d, 'd')}
                  </span>
                  {has && <span className="text-[9px] text-ink mt-0.5">●</span>}
                </div>
              )
            })}
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-6 text-ink2">A carregar…</div>
        ) : shifts.length === 0 ? (
          <EmptyState icon="📅" title="Sem turnos este mês" description="O teu owner ainda não te escalou para nenhum dia." />
        ) : (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-ink">Turnos do mês</h3>
            {shifts.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-ink capitalize">
                      {format(parseISO(s.shift_date), 'EEEE, dd MMM', { locale: ptPT })}
                    </p>
                    {s.start_at && s.end_at && (
                      <p className="text-xs text-ink2">
                        {format(parseISO(s.start_at), 'HH:mm')} - {format(parseISO(s.end_at), 'HH:mm')}
                      </p>
                    )}
                    {s.tuktuk_id && tuktuks[s.tuktuk_id] && (
                      <p className="text-xs text-ink2">🛺 {tuktuks[s.tuktuk_id].nickname || tuktuks[s.tuktuk_id].plate}</p>
                    )}
                    {s.notes && <p className="text-xs text-ink2 mt-1">{s.notes}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  )
}
