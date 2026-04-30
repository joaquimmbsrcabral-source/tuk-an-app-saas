import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input, TextArea, Select } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { Booking, TukTuk, TourCatalogItem, Profile } from '../../lib/types'
import { formatDateTime, formatCurrency } from '../../lib/format'
import {
  Plus,
  Trash2,
  List,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Clock,
  Download,
} from 'lucide-react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'

type ViewMode = 'list' | 'calendar'

export const BookingsPage: React.FC = () => {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tuktuks, setTuktuks] = useState<TukTuk[]>([])
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [tours, setTours] = useState<TourCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    tour_type: '',
    pax: 1,
    start_at: '',
    end_at: '',
    price: 0,
    tuktuk_id: '',
    driver_id: '',
    pickup_location: '',
    notes: '',
  })

  useEffect(() => {
    if (profile) {
      fetchBookings()
      fetchTuktuks()
      fetchDrivers()
      fetchTours()
    }
  }, [profile])

  const fetchTours = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('tour_catalog')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('active', true)
      .order('name')
    setTours(data || [])
  }

  const handleSelectTour = (tourId: string) => {
    const t = tours.find((x) => x.id === tourId)
    if (!t) {
      setForm({ ...form, tour_type: '' })
      return
    }
    let end_at = form.end_at
    if (form.start_at) {
      const start = new Date(form.start_at)
      const end = new Date(start.getTime() + t.default_duration_min * 60000)
      end_at = end.toISOString().slice(0, 16)
    }
    setForm({ ...form, tour_type: t.name, price: Number(t.default_price), end_at })
  }

  const fetchBookings = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('start_at', { ascending: false })
      setBookings(data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTuktuks = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('tuktuks')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('status', 'active')
      setTuktuks(data || [])
    } catch (err) {
      console.error('Error fetching tuktuks:', err)
    }
  }

  const fetchDrivers = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('role', 'driver')
      setDrivers(data || [])
    } catch (err) {
      console.error('Error fetching drivers:', err)
    }
  }

  const driverNames = useMemo(() => {
    const map: Record<string, string> = {}
    drivers.forEach((d) => { map[d.id] = d.full_name })
    return map
  }, [drivers])

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      in_progress: 'Em Curso',
      completed: 'Completa',
      cancelled: 'Cancelada',
    }
    return map[s] || s
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green bg-opacity-10 text-green'
      case 'cancelled': return 'bg-copper bg-opacity-10 text-copper'
      case 'confirmed': return 'bg-green bg-opacity-10 text-green'
      case 'in_progress': return 'bg-yellow bg-opacity-10 text-ink'
      default: return 'bg-yellow bg-opacity-10 text-ink'
    }
  }

  /**
   * Detecta sobreposições com reservas ativas para o mesmo TukTuk ou motorista.
   * Devolve descrição legível dos conflitos (vazio = sem conflitos).
   */
  const findConflicts = (): string[] => {
    if (!form.start_at || !form.end_at) return []
    const newStart = new Date(form.start_at).getTime()
    const newEnd = new Date(form.end_at).getTime()
    if (isNaN(newStart) || isNaN(newEnd) || newEnd <= newStart) return []

    const conflicts: string[] = []
    bookings.forEach((b) => {
      if (b.status === 'cancelled' || b.status === 'completed') return
      const bStart = new Date(b.start_at).getTime()
      const bEnd = new Date(b.end_at).getTime()
      const overlaps = newStart < bEnd && newEnd > bStart
      if (!overlaps) return

      if (form.tuktuk_id && b.tuktuk_id === form.tuktuk_id) {
        const tt = tuktuks.find((t) => t.id === form.tuktuk_id)
        conflicts.push(`TukTuk ${tt?.nickname || tt?.plate || ''} já tem reserva (${b.customer_name}) das ${format(parseISO(b.start_at), 'HH:mm')} às ${format(parseISO(b.end_at), 'HH:mm')}.`)
      }
      if (form.driver_id && b.driver_id === form.driver_id) {
        const drv = drivers.find((d) => d.id === form.driver_id)
        conflicts.push(`Motorista ${drv?.full_name || ''} já tem reserva (${b.customer_name}) das ${format(parseISO(b.start_at), 'HH:mm')} às ${format(parseISO(b.end_at), 'HH:mm')}.`)
      }
    })
    return conflicts
  }

  const handleSave = async () => {
    if (!profile) return

    // Conflict detection — pede confirmação se houver sobreposição
    const conflicts = findConflicts()
    if (conflicts.length > 0) {
      const ok = window.confirm(
        '⚠️ Conflito de reserva detectado:\n\n' +
        conflicts.join('\n') +
        '\n\nQueres mesmo assim guardar esta reserva?'
      )
      if (!ok) return
    }

    setSaving(true)
    try {
      await supabase
        .from('bookings')
        .insert([
          {
            ...form,
            company_id: profile.company_id,
            status: 'pending',
            source: 'app',
            pax: parseInt(form.pax.toString()),
            price: parseFloat(form.price.toString()),
          },
        ])
      await fetchBookings()
      setIsModalOpen(false)
      setForm({
        customer_name: '',
        customer_phone: '',
        tour_type: '',
        pax: 1,
        start_at: '',
        end_at: '',
        price: 0,
        tuktuk_id: '',
        driver_id: '',
        pickup_location: '',
        notes: '',
      })
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return
    try {
      await supabase.from('bookings').delete().eq('id', id)
      await fetchBookings()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  /* ── Calendar helpers ── */
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days: Date[] = []
    let day = calStart
    while (day <= calEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [calendarMonth])

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    bookings.forEach((b) => {
      if (b.status === 'cancelled') return
      const key = format(parseISO(b.start_at), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(b)
    })
    return map
  }, [bookings])

  const selectedDayBookings = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return bookingsByDate[key] || []
  }, [selectedDate, bookingsByDate])

  const exportCSV = () => {
    if (bookings.length === 0) return
    const escape = (v: any) => {
      const s = v == null ? '' : String(v)
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const statusMap: Record<string, string> = {
      pending: 'Pendente', confirmed: 'Confirmada', in_progress: 'Em Curso',
      completed: 'Completa', cancelled: 'Cancelada',
    }
    const headers = ['Data Início', 'Data Fim', 'Cliente', 'Telefone', 'Tour', 'Pax', 'Preço (€)', 'Estado', 'Motorista', 'TukTuk', 'Origem', 'Notas']
    const rows = bookings.map((b) => {
      const drv = drivers.find((d) => d.id === b.driver_id)
      const tt = tuktuks.find((t) => t.id === b.tuktuk_id)
      return [
        b.start_at, b.end_at, b.customer_name, b.customer_phone,
        b.tour_type, b.pax, Number(b.price).toFixed(2),
        statusMap[b.status] || b.status, drv?.full_name || '',
        tt?.nickname || tt?.plate || '', b.source, b.notes || '',
      ].map(escape).join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openNewForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd'T'10:00")
    setForm({
      customer_name: '',
      customer_phone: '',
      tour_type: '',
      pax: 1,
      start_at: dateStr,
      end_at: '',
      price: 0,
      tuktuk_id: '',
      driver_id: '',
      pickup_location: '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  if (loading)
    return (
      <OwnerLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-line rounded-lg animate-pulse" />
          <div className="h-96 bg-card border border-line rounded-2xl animate-pulse" />
        </div>
      </OwnerLayout>
    )

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-ink">Reservas</h1>
            <p className="text-sm text-ink2 mt-0.5">
              {bookings.filter((b) => b.status !== 'cancelled').length} reservas activas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-card border border-line rounded-xl overflow-hidden shadow-card">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 transition-colors ${
                  viewMode === 'calendar' ? 'bg-ink text-cream' : 'text-ink2 hover:text-ink hover:bg-cream'
                }`}
                title="Calendário"
              >
                <Calendar size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-ink text-cream' : 'text-ink2 hover:text-ink hover:bg-cream'
                }`}
                title="Lista"
              >
                <List size={16} />
              </button>
            </div>
            {bookings.length > 0 && (
              <Button onClick={exportCSV} variant="ghost" size="sm" title="Exportar CSV">
                <Download size={18} className="mr-1" /> CSV
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)} variant="primary">
              <Plus size={18} className="mr-1.5" />
              Nova Reserva
            </Button>
          </div>
        </div>

        {/* ── Legend ── */}
        {viewMode === 'calendar' && (
          <div className="flex items-center gap-4 text-xs text-ink2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green" />
              <span>Com motorista</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-copper" />
              <span>Sem motorista</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow" />
              <span>Pendente</span>
            </div>
          </div>
        )}

        {/* ── Calendar View ── */}
        {viewMode === 'calendar' && (
          <>
            <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
              {/* Month navigation */}
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <button
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-cream transition-colors text-ink2 hover:text-ink"
                >
                  <ChevronLeft size={18} />
                </button>
                <h2 className="text-sm font-bold text-ink capitalize">
                  {format(calendarMonth, 'MMMM yyyy', { locale: ptPT })}
                </h2>
                <button
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-cream transition-colors text-ink2 hover:text-ink"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-line">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] font-bold text-ink2 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const dayBookings = bookingsByDate[dayKey] || []
                  const inMonth = isSameMonth(day, calendarMonth)
                  const today = isToday(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)

                  const withDriver = dayBookings.filter((b) => b.driver_id && b.status !== 'pending')
                  const withoutDriver = dayBookings.filter((b) => !b.driver_id && b.status !== 'pending')
                  const pending = dayBookings.filter((b) => b.status === 'pending')

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={`relative min-h-[72px] md:min-h-[80px] p-1.5 border-b border-r border-line text-left transition-colors ${
                        !inMonth ? 'bg-cream bg-opacity-50' : ''
                      } ${isSelected ? 'bg-yellow bg-opacity-10 ring-1 ring-inset ring-yellow' : 'hover:bg-cream'}`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${
                        today
                          ? 'w-5 h-5 rounded-full bg-ink text-cream flex items-center justify-center text-[10px]'
                          : inMonth ? 'text-ink' : 'text-ink2 opacity-40'
                      }`}>
                        {format(day, 'd')}
                      </div>

                      {/* Booking dots/pills */}
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 3).map((b) => {
                          const hasDriver = !!b.driver_id
                          const isPending = b.status === 'pending'
                          const dotColor = isPending
                            ? 'bg-yellow text-ink'
                            : hasDriver
                            ? 'bg-green bg-opacity-15 text-green'
                            : 'bg-copper bg-opacity-15 text-copper'

                          return (
                            <div
                              key={b.id}
                              className={`${dotColor} rounded px-1 py-0.5 text-[9px] font-semibold truncate leading-tight`}
                              title={`${b.customer_name} · ${b.tour_type} · ${format(parseISO(b.start_at), 'HH:mm')}${hasDriver ? ` · ${driverNames[b.driver_id] || ''}` : ' · SEM MOTORISTA'}`}
                            >
                              {format(parseISO(b.start_at), 'HH:mm')} {b.customer_name.split(' ')[0]}
                            </div>
                          )
                        })}
                        {dayBookings.length > 3 && (
                          <div className="text-[9px] font-semibold text-ink2">
                            +{dayBookings.length - 3} mais
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected day detail */}
            {selectedDate && (
              <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                  <h2 className="text-sm font-bold text-ink capitalize">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptPT })}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink2">
                      {selectedDayBookings.length} {selectedDayBookings.length === 1 ? 'reserva' : 'reservas'}
                    </span>
                    <button
                      onClick={() => openNewForDate(selectedDate)}
                      className="text-xs font-semibold text-copper hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  </div>
                </div>

                {selectedDayBookings.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-ink2 mb-3">Nenhuma reserva neste dia</p>
                    <button
                      onClick={() => openNewForDate(selectedDate)}
                      className="text-sm font-semibold text-copper hover:underline"
                    >
                      Criar reserva
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {selectedDayBookings
                      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
                      .map((b) => {
                        const hasDriver = !!b.driver_id
                        return (
                          <div key={b.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-cream transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                                b.status === 'pending' ? 'bg-yellow' : hasDriver ? 'bg-green' : 'bg-copper'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-ink truncate">{b.customer_name}</p>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${statusColor(b.status)}`}>
                                    {statusLabel(b.status)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-ink2">
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {format(parseISO(b.start_at), 'HH:mm')}
                                  </span>
                                  <span className="truncate">{b.tour_type}</span>
                                  <span className="flex items-center gap-1">
                                    <Users size={10} />
                                    {b.pax}
                                  </span>
                                  {b.pickup_location && (
                                    <span className="flex items-center gap-1 truncate">
                                      <MapPin size={10} />
                                      {b.pickup_location}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5">
                                  {hasDriver ? (
                                    <span className="text-[10px] font-semibold text-green">
                                      {driverNames[b.driver_id] || 'Motorista atribuído'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-copper">
                                      Sem motorista atribuído
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              <span className="text-sm font-bold text-ink">{formatCurrency(b.price)}</span>
                              <Button onClick={() => handleDelete(b.id)} variant="secondary" size="sm">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── List View ── */}
        {viewMode === 'list' && (
          <>
            {bookings.length === 0 ? (
              <EmptyState
                icon="📅"
                title="Nenhuma Reserva"
                description="Comece a adicionar reservas"
                action={{ label: 'Nova Reserva', onClick: () => setIsModalOpen(true) }}
              />
            ) : (
              <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
                <div className="divide-y divide-line">
                  {bookings.map((booking) => {
                    const hasDriver = !!booking.driver_id
                    return (
                      <div
                        key={booking.id}
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-cream transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                            booking.status === 'cancelled'
                              ? 'bg-line'
                              : booking.status === 'pending'
                              ? 'bg-yellow'
                              : hasDriver
                              ? 'bg-green'
                              : 'bg-copper'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-ink truncate">{booking.customer_name}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${statusColor(booking.status)}`}>
                                {statusLabel(booking.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-ink2">
                              <span>{formatDateTime(booking.start_at)}</span>
                              <span className="truncate">{booking.tour_type}</span>
                              <span>{booking.pax} pax</span>
                            </div>
                            <div className="mt-0.5">
                              {hasDriver ? (
                                <span className="text-[10px] font-semibold text-green">
                                  {driverNames[booking.driver_id] || 'Motorista atribuído'}
                                </span>
                              ) : booking.status !== 'cancelled' ? (
                                <span className="text-[10px] font-semibold text-copper">
                                  Sem motorista
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="text-sm font-bold text-ink">{formatCurrency(booking.price)}</span>
                          <Button onClick={() => handleDelete(booking.id)} variant="secondary" size="sm">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Reserva">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <Input
            label="Nome do Cliente"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            required
          />
          <Input
            label="Telefone"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
          />
          {tours.length > 0 ? (
            <Select
              label="Tour"
              options={[
                { value: '', label: '\u2014 Escolhe do cat\u00e1logo \u2014' },
                ...tours.map((t) => ({ value: t.id, label: `${t.name} \u00b7 \u20ac${Number(t.default_price).toFixed(2)}` })),
              ]}
              value={tours.find((t) => t.name === form.tour_type)?.id || ''}
              onChange={(e) => handleSelectTour(e.target.value)}
            />
          ) : (
            <Input
              label="Tipo de Tour"
              value={form.tour_type}
              onChange={(e) => setForm({ ...form, tour_type: e.target.value })}
              placeholder="Adiciona tours em Defini\u00e7\u00f5es \u2192 Cat\u00e1logo"
            />
          )}
          <Select
            label="Motorista"
            options={[
              { value: '', label: '\u2014 Sem motorista \u2014' },
              ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
            ]}
            value={form.driver_id}
            onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
          />
          <Select
            label="TukTuk"
            options={[
              { value: '', label: '\u2014 Sem TukTuk \u2014' },
              ...tuktuks.map((t) => ({ value: t.id, label: t.nickname || t.plate })),
            ]}
            value={form.tuktuk_id}
            onChange={(e) => setForm({ ...form, tuktuk_id: e.target.value })}
          />
          <Input
            label="Passageiros"
            type="number"
            value={form.pax}
            onChange={(e) => setForm({ ...form, pax: parseInt(e.target.value) || 1 })}
            min="1"
          />
          <Input
            label="Data/Hora In\u00edcio"
            type="datetime-local"
            value={form.start_at}
            onChange={(e) => setForm({ ...form, start_at: e.target.value })}
            required
          />
          <Input
            label="Data/Hora Fim"
            type="datetime-local"
            value={form.end_at}
            onChange={(e) => setForm({ ...form, end_at: e.target.value })}
          />
          <Input
            label="Pre\u00e7o (\u20ac)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            step="0.01"
          />
          <Input
            label="Local de Partida"
            value={form.pickup_location}
            onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
            placeholder="Hotel X, Av. Y"
          />
          <TextArea
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Criando...' : 'Criar Reserva'}
            </Button>
            <Button onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
