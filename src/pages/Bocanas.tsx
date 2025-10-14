import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBocanas } from '../hooks/useBocanas'
import { useApostadores } from '../hooks/useApostadores'
import { useSelection } from '../hooks/useSelection'
import { useExport } from '../hooks/useExport'
import { useComidaOptions } from '../hooks/useComidaOptions'
import { useIsMobile } from '../hooks/use-mobile'
import { CheckCircle, Filter, Loader2, Search, Utensils, XCircle, Clock, Grid3X3, List, LayoutGrid, User, Trophy, Calendar, Target } from 'lucide-react'
import BulkActions from '../components/BulkActions'
import QuickStats from '../components/QuickStats'
import AdvancedFilters from '../components/AdvancedFilters'
import BocanaCard from '../components/BocanaCard'
import MobileBocanaCard from '../components/MobileBocanaCard'
import { Bocana } from '../lib/airtable'

const statuses = ['Pendiente', 'Pagada'] as const
const torneos = ['X Empresarial', 'XI Empresarial', 'XII Empresarial'] as const
// Las comidas ahora se obtienen dinámicamente de Airtable

const Bocanas: React.FC = () => {
  const [status, setStatus] = useState<(typeof statuses)[number] | ''>('')
  const [torneo, setTorneo] = useState<(typeof torneos)[number] | ''>('')
  const [jugadorId, setJugadorId] = useState<string>('')
  const [jugadorNombre, setJugadorNombre] = useState<string>('')
  const [jornada, setJornada] = useState<string>('')
  const [search, setSearch] = useState('')
  // Estados de procesamiento y pago individual
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentModal, setPaymentModal] = useState<{ bocanaId: string; jugadorNombre: string } | null>(null)
  const [selectedComida, setSelectedComida] = useState<string>('')
  const [sort, setSort] = useState<{ key: 'Jugador' | 'Torneo' | 'Jornada' | 'Tipo' | 'Comida' | 'Estado'; dir: 'asc' | 'desc' }>({ key: 'Jornada', dir: 'asc' })
  const [comidaFilter, setComidaFilter] = useState<(typeof comidas)[number] | ''>('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const { apostadores, fetchApostadores } = useApostadores()
  const location = useLocation()
  const navigate = useNavigate()
  const { bocanas, loading, fetchBocanas, actualizarBocana, hasMore, loadingMore, loadMore } = useBocanas({
    status: status || undefined,
    torneo: torneo || undefined,
    jugadorId: jugadorId || undefined,
    jugadorNombre: jugadorNombre || undefined,
    jornada: jornada ? Number(jornada) : undefined,
  })
  
  const { exportToCSV, shareWhatsApp } = useExport()
  const { comidas, loading: loadingComidas } = useComidaOptions()
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchApostadores()
  }, [fetchApostadores])

  // Leer filtros desde query params al montar
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qStatus = params.get('status') as any
    const qTorneo = params.get('torneo') as any
    const qJornada = params.get('jornada')
    const qJugadorId = params.get('jugadorId') || ''
    const qComida = params.get('comida') as any
    if (qStatus) setStatus(qStatus)
    if (qTorneo) setTorneo(qTorneo)
    if (qJornada && !Number.isNaN(Number(qJornada))) setJornada(String(Math.max(1, Number(qJornada))))
    if (qJugadorId) setJugadorId(qJugadorId)
    if (qComida) setComidaFilter(qComida)
    // jugadorNombre se derivará al render del select si coincide el id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia: cargar filtros/orden al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bocanas_list_state')
      if (!raw) return
      const s = JSON.parse(raw)
      if (s && typeof s === 'object') {
        if (s.status !== undefined) setStatus(s.status)
        if (s.torneo !== undefined) setTorneo(s.torneo)
        if (s.jugadorId !== undefined) setJugadorId(s.jugadorId)
        if (s.jugadorNombre !== undefined) setJugadorNombre(s.jugadorNombre)
        if (s.jornada !== undefined) setJornada(s.jornada)
        if (s.search !== undefined) setSearch(s.search)
        if (s.comidaFilter !== undefined) setComidaFilter(s.comidaFilter)
        if (s.sort && s.sort.key && s.sort.dir) setSort(s.sort)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia: guardar cuando cambien
  useEffect(() => {
    const payload = {
      status,
      torneo,
      jugadorId,
      jugadorNombre,
      jornada,
      search,
      sort,
      comidaFilter,
    }
    try {
      localStorage.setItem('bocanas_list_state', JSON.stringify(payload))
    } catch {}
  }, [status, torneo, jugadorId, jugadorNombre, jornada, search, sort, comidaFilter])

  const clearFilters = () => {
    setStatus('')
    setTorneo('')
    setJugadorId('')
    setJugadorNombre('')
    setJornada('')
    setComidaFilter('')
    setSearch('')
    selection.clearSelection()
  }
  
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    Object.entries(newFilters).forEach(([key, value]) => {
      switch (key) {
        case 'status': 
          setStatus((value || '') as any); 
          break;
        case 'torneo': 
          setTorneo((value || '') as any); 
          break;
        case 'jugadorId': 
          setJugadorId(value || ''); 
          // Si se cambia el jugador, buscar el nombre
          if (value) {
            const jugador = apostadores.find(a => a.id === value);
            setJugadorNombre(jugador?.fields.Nombre || '');
          } else {
            setJugadorNombre('');
          }
          break;
        case 'jugadorNombre': 
          setJugadorNombre(value || ''); 
          break;
        case 'jornada': 
          setJornada(value || ''); 
          break;
        case 'comidaFilter': 
          setComidaFilter((value || '') as any); 
          break;
        case 'search': 
          setSearch(value || ''); 
          break;
      }
    })
  }
  
  const filters = {
    status,
    torneo,
    jugadorId,
    jornada,
    search,
    comidaFilter
  }

  const filtered = useMemo(() => {
    let base = bocanas
    if (comidaFilter) {
      base = base.filter(b => (b.fields.Comida || '') === comidaFilter)
    }
    const term = search.trim().toLowerCase()
    if (!term) return base
    return base.filter(b => {
      const n = b.fields.Jugador_Nombre?.toLowerCase() || ''
      const t = b.fields.Torneo?.toLowerCase() || ''
      const tipo = b.fields.Tipo?.toLowerCase() || ''
      const comida = b.fields.Comida?.toLowerCase() || ''
      return [n, t, tipo, comida, String(b.fields.Jornada)].some(v => v.includes(term))
    })
  }, [bocanas, comidaFilter, search])

  const sorted = useMemo(() => {
    const arr = filtered.slice()
    const dirMul = sort.dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const getVal = (x: typeof a) => {
        switch (sort.key) {
          case 'Jugador': return x.fields.Jugador_Nombre || ''
          case 'Torneo': return x.fields.Torneo || ''
          case 'Jornada': return Number(x.fields.Jornada) || 0
          case 'Tipo': return x.fields.Tipo || ''
          case 'Comida': return x.fields.Comida || ''
          case 'Estado': return x.fields.Status || ''
        }
      }
      const va: any = getVal(a)
      const vb: any = getVal(b)
      if (typeof va === 'number' || typeof vb === 'number') {
        return (Number(va) - Number(vb)) * dirMul
      }
      return String(va).localeCompare(String(vb)) * dirMul
    })
    return arr
  }, [filtered, sort])
  
  const selection = useSelection({
    items: sorted,
    getItemId: (item) => item.id
  })

  const toggleSort = (key: typeof sort.key) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  const torneoColor = (t?: string) => {
    switch (t) {
      case 'X Empresarial': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300'
      case 'XI Empresarial': return 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300'
      case 'XII Empresarial': return 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300'
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
    }
  }

  const comidaColor = (c?: string) => {
    switch (c) {
      case 'Boneless': return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300'
      case 'Pizza': return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300'
      case 'Churrasco Bocas': return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300'
      case 'Paninni Churrasco': return 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border-cyan-300'
      case 'Quesadilla': return 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-800 border-lime-300'
      default: return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300'
    }
  }

  // Funciones de pago individual
  const openPaymentModal = (bocanaId: string, jugadorNombre: string) => {
    setPaymentModal({ bocanaId, jugadorNombre });
    setSelectedComida(comidas.length > 0 ? comidas[0] : ''); // Reset a la primera comida
  };
  
  const closePaymentModal = () => {
    setPaymentModal(null);
    setSelectedComida('');
  };
  
  const processIndividualPayment = async () => {
    if (!paymentModal || !selectedComida) return;
    
    setProcessingPayment(true);
    try {
      await actualizarBocana(paymentModal.bocanaId, { 
        Status: 'Pagada', 
        Comida: selectedComida as any 
      });
      await fetchBocanas();
      closePaymentModal();
    } catch (error) {
      console.error('Error al procesar pago:', error);
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Función de pago para acciones en lote
  const processPayment = async (bocanaId: string, comida: string) => {
    try {
      await actualizarBocana(bocanaId, { Status: 'Pagada', Comida: comida as any });
    } catch (error) {
      console.error('Error al procesar pago:', error);
      throw error;
    }
  }
  
  const handleBulkMarkAsPaid = async (items: Bocana[], comida: string) => {
    setBulkProcessing(true)
    try {
      for (const item of items) {
        await actualizarBocana(item.id, { Status: 'Pagada', Comida: comida as any })
      }
      await fetchBocanas()
    } finally {
      setBulkProcessing(false)
    }
  }
  
  const handleShareSingle = (bocana: Bocana) => {
    shareWhatsApp([bocana], `Bocana de ${bocana.fields.Jugador_Nombre}`)
  }
  
  const markAllPendingAsPaid = async (jugadorId: string, comida: string) => {
    const pendingBocanas = sorted.filter(b => 
      b.fields.Status === 'Pendiente' && 
      (b.fields.Jugador_ID === jugadorId || (b.fields as any).Jugador === jugadorId)
    );
    
    if (pendingBocanas.length === 0) return;
    
    setBulkProcessing(true);
    try {
      for (const bocana of pendingBocanas) {
        await actualizarBocana(bocana.id, { Status: 'Pagada', Comida: comida as any });
      }
      await fetchBocanas();
    } finally {
      setBulkProcessing(false);
    }
  }

  // Cargar vista mode desde localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('bocanas_view_mode')
    if (savedViewMode === 'cards' || savedViewMode === 'table') {
      setViewMode(savedViewMode)
    }
  }, [])
  
  // Guardar vista mode en localStorage
  useEffect(() => {
    localStorage.setItem('bocanas_view_mode', viewMode)
  }, [viewMode])

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Utensils size={28} className="mr-3 text-blue-600" /> Bocanas Pro
        </h1>
        <div className="flex items-center space-x-3">
          {/* Toggle de vista - oculto en móvil */}
          {!isMobile && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vista de tabla"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vista de tarjetas"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          )}
          
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (status) params.set('status', String(status))
              if (torneo) params.set('torneo', String(torneo))
              if (jornada) params.set('jornada', String(jornada))
              if (jugadorId) params.set('jugadorId', String(jugadorId))
              if (comidaFilter) params.set('comida', String(comidaFilter))
              navigate(`/bocanas-dashboard?${params.toString()}`)
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Ver en dashboard"
          >Ir al dashboard</button>
        </div>
      </div>

      {/* Stats rápidas */}
      <QuickStats bocanas={filtered} loading={loading} />
      
      {/* Filtros avanzados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        apostadores={apostadores}
      />
      
      {/* Acciones en lote */}
      <BulkActions
        selectedItems={selection.selectedItems}
        selectedCount={selection.selectedCount}
        onMarkAsPaid={handleBulkMarkAsPaid}
        onExport={(items) => exportToCSV(items, 'bocanas-seleccionadas')}
        onShare={(items) => shareWhatsApp(items, 'Bocanas Seleccionadas')}
        onClearSelection={selection.clearSelection}
        loading={bulkProcessing}
      />
      
      {/* Acciones rápidas para jugador seleccionado */}
      {jugadorId && (() => {
        const jugadorNombre = apostadores.find(a => a.id === jugadorId)?.fields.Nombre;
        const pendingCount = sorted.filter(b => 
          b.fields.Status === 'Pendiente' && 
          (b.fields.Jugador_ID === jugadorId || (b.fields as any).Jugador === jugadorId)
        ).length;
        
        if (pendingCount === 0) return null;
        
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {pendingCount}
          </div>
                <span className="text-amber-800 font-medium">
                  {jugadorNombre} tiene {pendingCount} bocana{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                </span>
          </div>
              
              <button
                onClick={() => {
                  const comida = prompt('Selecciona la comida para todas las bocanas pendientes:', comidas[0]);
                  if (comida && comidas.includes(comida as any)) {
                    markAllPendingAsPaid(jugadorId, comida);
                  }
                }}
                disabled={bulkProcessing}
                className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <CheckCircle size={16} className="mr-2" />
                Marcar todas como pagadas
          </button>
        </div>
          </div>
        );
      })()}

      {/* Contador de resultados */}
      <div className={`mb-4 flex items-center justify-between ${
        isMobile ? 'flex-col space-y-2' : 'flex-row'
      }`}>
        <div className={`flex items-center ${
          isMobile ? 'flex-col space-y-1 text-center' : 'space-x-4'
        }`}>
          <span className={`text-gray-600 ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            Mostrando <span className="font-semibold text-gray-900">{sorted.length}</span> de <span className="font-semibold text-gray-900">{bocanas.length}</span> bocanas
          </span>
          {selection.selectedCount > 0 && (
            <span className={`text-blue-600 font-medium ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              {selection.selectedCount} seleccionada{selection.selectedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {sorted.length > 0 && (
          <div className={`text-gray-500 ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            {sorted.filter(b => b.fields.Status === 'Pendiente').length} pendientes • {sorted.filter(b => b.fields.Status === 'Pagada').length} pagadas
          </div>
        )}
      </div>

      {/* Contenido principal */}
      {viewMode === 'table' && !isMobile ? (
        // Vista de tabla moderna
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative">
          {/* Overlay de procesamiento */}
          {bulkProcessing && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-20 rounded-2xl">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Procesando pagos...</p>
                  <p className="text-sm text-gray-600">Por favor espera mientras se actualizan las bocanas</p>
                </div>
              </div>
            </div>
          )}
          <div className="overflow-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selection.isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = selection.isPartiallySelected
                        }}
                        onChange={selection.toggleAll}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      className="group flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors" 
                      onClick={() => toggleSort('Jugador')}
                    >
                      <User size={14} className="text-gray-500 group-hover:text-gray-700" />
                      Jugador 
                      <span className="text-blue-600">
                        {sort.key === 'Jugador' ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                  </button>
                </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      className="group flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors" 
                      onClick={() => toggleSort('Torneo')}
                    >
                      <Trophy size={14} className="text-gray-500 group-hover:text-gray-700" />
                      Torneo 
                      <span className="text-blue-600">
                        {sort.key === 'Torneo' ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                  </button>
                </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      className="group flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors" 
                      onClick={() => toggleSort('Jornada')}
                    >
                      <Calendar size={14} className="text-gray-500 group-hover:text-gray-700" />
                      Jornada 
                      <span className="text-blue-600">
                        {sort.key === 'Jornada' ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                  </button>
                </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      className="group flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors" 
                      onClick={() => toggleSort('Tipo')}
                    >
                      <Target size={14} className="text-gray-500 group-hover:text-gray-700" />
                      Tipo 
                      <span className="text-blue-600">
                        {sort.key === 'Tipo' ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                  </button>
                </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      className="group flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors" 
                      onClick={() => toggleSort('Comida')}
                    >
                      <Utensils size={14} className="text-gray-500 group-hover:text-gray-700" />
                      Comida 
                      <span className="text-blue-600">
                        {sort.key === 'Comida' ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                  </button>
                </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      className="group flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors" 
                      onClick={() => toggleSort('Estado')}
                    >
                      <CheckCircle size={14} className="text-gray-500 group-hover:text-gray-700" />
                      Estado 
                      <span className="text-blue-600">
                        {sort.key === 'Estado' ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                  </button>
                </th>
                  <th className="px-6 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-700">Fecha</span>
                  </th>
              </tr>
            </thead>
              <tbody className="bg-white">
              {loading ? (
                <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                        <p className="text-gray-500 font-medium">Cargando bocanas...</p>
                      </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Utensils className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">No se encontraron bocanas</p>
                        <p className="text-gray-400 text-sm">Intenta ajustar los filtros</p>
                      </div>
                    </td>
                </tr>
              ) : (
                  sorted.map((b, index) => {
                    const isSelected = selection.isSelected(b);
                    const isPending = b.fields.Status === 'Pendiente';
                    const creationDate = (() => {
                      const f: any = b.fields as any;
                      const c = f['Creación'] || f['Creacion'] || f['creacion'];
                      return c ? new Date(c).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit',
                        year: '2-digit'
                      }) : '—';
                    })();
                    
                    return (
                      <tr 
                        key={b.id} 
                        className={`
                          group border-b border-gray-100 transition-all duration-200 hover:shadow-sm
                          ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                              : index % 2 === 0 
                                ? 'bg-white hover:bg-gray-50' 
                                : 'bg-gray-50/30 hover:bg-gray-50'
                          }
                          ${isPending ? 'hover:bg-yellow-50' : ''}
                        `}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => selection.toggleItem(b)}
                              className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {(b.fields.Jugador_Nombre || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{b.fields.Jugador_Nombre || 'Sin nombre'}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${torneoColor(b.fields.Torneo)}`}>
                            <Trophy size={12} className="mr-1" />
                        {b.fields.Torneo || '—'}
                      </span>
                    </td>
                        
                        <td className="px-6 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-700 font-bold text-xs">{b.fields.Jornada}</span>
                            </div>
                            <span className="text-gray-600 text-xs">J{b.fields.Jornada}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">
                            <Target size={12} className="mr-1 text-gray-600" />
                            {b.fields.Tipo}
                          </span>
                    </td>
                        
                        <td className="px-6 py-3">
                      {b.fields.Status === 'Pendiente' ? (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                              <span className="text-gray-400 text-xs font-medium">Sin asignar</span>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${comidaColor(b.fields.Comida)}`}>
                              <Utensils size={12} className="mr-1" />
                              {String(b.fields.Comida)}
                        </span>
                      )}
                    </td>
                        
                        <td className="px-6 py-3">
                          <div className="flex items-center space-x-2">
                            {isPending ? (
                              <>
                                <div className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full border border-yellow-200">
                                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></div>
                                  <Clock size={12} className="mr-1" />
                                  <span className="font-semibold text-xs">Pendiente</span>
                                </div>
                                <button
                                  onClick={() => openPaymentModal(b.id, b.fields.Jugador_Nombre || 'Sin nombre')}
                                  className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                                  title="Marcar como pagada"
                                >
                                  <Utensils size={12} className="mr-1" />
                                  Pagar
                        </button>
                              </>
                            ) : (
                              <div className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full border border-green-200">
                                <CheckCircle size={12} className="mr-1 text-green-600" />
                                <span className="font-semibold text-xs">Pagada</span>
                        </div>
                      )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-3 text-center">
                          <div className="text-xs text-gray-500">
                            <Calendar size={12} className="inline mr-1" />
                            {creationDate}
                          </div>
                    </td>
                  </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        // Vista de cards (siempre en móvil)
        <div className={`grid gap-4 ${
          isMobile 
            ? 'grid-cols-1' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Utensils size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No se encontraron bocanas</p>
            </div>
          ) : (
            sorted.map(b => (
              isMobile ? (
                <MobileBocanaCard
                  key={b.id}
                  bocana={b}
                  isSelected={selection.isSelected(b)}
                  onToggleSelect={() => selection.toggleItem(b)}
                  onPayment={() => openPaymentModal(b.id, b.fields.Jugador_Nombre || 'Sin nombre')}
                />
              ) : (
                <BocanaCard
                  key={b.id}
                  bocana={b}
                  isSelected={selection.isSelected(b)}
                  onToggleSelect={() => selection.toggleItem(b)}
                  onMarkAsPaid={async (id, comida) => {
                    await actualizarBocana(id, { Status: 'Pagada', Comida: comida as any })
                    await fetchBocanas()
                  }}
                  onShare={handleShareSingle}
                />
              )
            ))
          )}
        </div>
      )}

      {/* Botón cargar más */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {loadingMore ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Cargando más...
              </>
            ) : (
              'Cargar más bocanas'
            )}
          </button>
        </div>
      )}
      
      {/* Modal de pago individual */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white shadow-2xl w-full overflow-hidden ${
            isMobile 
              ? 'rounded-t-2xl fixed bottom-0 left-0 right-0 max-h-[80vh]' 
              : 'rounded-2xl max-w-md mx-4'
          }`}>
            {/* Header del modal */}
            <div className={`bg-gradient-to-r from-green-600 to-emerald-600 ${
              isMobile ? 'px-4 py-3' : 'px-6 py-4'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Utensils size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Marcar como Pagada</h3>
                    <p className="text-green-100 text-sm">{paymentModal.jugadorNombre}</p>
                  </div>
                </div>
                <button
                  onClick={closePaymentModal}
                  disabled={processingPayment}
                  className="text-white hover:text-green-100 transition-colors disabled:opacity-50"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className={isMobile ? 'p-4' : 'p-6'}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Selecciona el plato que pagó:
                </label>
                
                {loadingComidas ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 text-green-600" />
                    <span className="ml-3 text-gray-600">Cargando opciones de comida...</span>
                  </div>
                ) : comidas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Utensils className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No se pudieron cargar las opciones de comida</p>
                    <p className="text-sm">Usando opciones por defecto</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {comidas.map((comida) => (
                      <button
                        key={comida}
                        onClick={() => setSelectedComida(comida)}
                        disabled={processingPayment}
                        className={`
                          flex items-center justify-between rounded-xl border-2 transition-all duration-200
                          ${isMobile ? 'p-3' : 'p-4'}
                          ${
                            selectedComida === comida
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedComida === comida ? 'border-green-500 bg-green-500' : 'border-gray-300'
                          }`}>
                            {selectedComida === comida && (
                              <CheckCircle size={12} className="text-white" />
                            )}
                          </div>
                          <span className="font-medium">{comida}</span>
                        </div>
                        <Utensils size={16} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={closePaymentModal}
                  disabled={processingPayment}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={processIndividualPayment}
                  disabled={processingPayment || !selectedComida}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Confirmar Pago
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bocanas
