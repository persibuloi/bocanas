import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApostadores } from '../hooks/useApostadores';
import { bocanasApi } from '../lib/airtable'; // Usamos el servicio refactorizado
import { ArrowLeft, PlusCircle, User, Trophy, Calendar, Utensils, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Asumo que se usa sonner o similar, si no, usaré alert o fallback
import { BocanaCreateSchema } from '../schemas';

const tipos = ['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100'] as const;
const torneos = ['X Empresarial', 'XI Empresarial', 'XII Empresarial'] as const;
const comidasSugeridas = ['Boneless', 'Pizza', 'Churrasco Bocas', 'Paninni Churrasco', 'Quesadilla', 'Tajadas Con queso'];

const NuevaBocana: React.FC = () => {
  const navigate = useNavigate();
  const { apostadores, loading: loadingJugadores, fetchApostadores } = useApostadores();

  const [form, setForm] = useState({
    jugador_id: '',
    torneo: '',
    jornada: '',
    tipo: '',
    status: 'Pendiente' as 'Pendiente' | 'Pagada',
    comida: ''
  });
  
  const [customComida, setCustomComida] = useState('');
  const [isCustomComida, setIsCustomComida] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [jugadorQuery, setJugadorQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Cargar apostadores al inicio
  useEffect(() => {
    fetchApostadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistencia de preferencias (localStorage)
  useEffect(() => {
    const j = localStorage.getItem('ultima_jornada_bocana');
    const t = localStorage.getItem('ultimo_torneo_bocana');
    const tp = localStorage.getItem('ultimo_tipo_bocana');
    
    setForm(prev => ({
      ...prev,
      jornada: j || prev.jornada,
      torneo: t || prev.torneo,
      tipo: tp || prev.tipo
    }));
  }, []);

  // Autocomplete logic
  const filteredApostadores = useMemo(() => {
    const q = jugadorQuery.trim().toLowerCase();
    if (!q) return apostadores.slice(0, 8);
    return apostadores.filter(a => a.fields.Nombre.toLowerCase().includes(q)).slice(0, 8);
  }, [apostadores, jugadorQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));

    // Persistencia
    if (name === 'jornada') localStorage.setItem('ultima_jornada_bocana', value);
    if (name === 'torneo') localStorage.setItem('ultimo_torneo_bocana', value);
    if (name === 'tipo') localStorage.setItem('ultimo_tipo_bocana', value);
  };

  const validate = () => {
    const e: { [k: string]: string } = {};
    
    try {
      // Validación parcial con Zod para lo básico
      if (!form.jugador_id) e.jugador_id = 'Selecciona un jugador válido';
      
      const jornadaNum = Number(form.jornada);
      if (!form.jornada || isNaN(jornadaNum) || jornadaNum < 1) {
        e.jornada = 'La jornada debe ser un número válido (mínimo 1)';
      }

      if (!form.torneo) e.torneo = 'Requerido';
      if (!form.tipo) e.tipo = 'Requerido';

      if (form.status === 'Pagada') {
        const comidaFinal = isCustomComida ? customComida : form.comida;
        if (!comidaFinal.trim()) {
          e.comida = 'Si está pagada, debes especificar qué comida fue';
        }
      }
    } catch (err) {
      console.error("Error validando", err);
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const comidaFinal = form.status === 'Pagada' 
        ? (isCustomComida ? customComida : form.comida) 
        : undefined;

      const created = await bocanasApi.create({
        Jugador_ID: form.jugador_id,
        Torneo: form.torneo as any,
        Jornada: Number(form.jornada),
        Tipo: form.tipo as any,
        Status: form.status,
        Comida: comidaFinal
      });

      // Verificar si se guardó la comida (si no, es porque Airtable la rechazó y entró el fallback)
      if (comidaFinal && !created.fields.Comida) {
        toast.warning('Bocana registrada, pero el plato NO se guardó. Verifica que el campo "Comida" en Airtable sea tipo Texto.', { duration: 6000 });
      } else {
        toast.success('Bocana registrada correctamente');
      }

      navigate('/bocanas');
    } catch (error) {
      console.error('Error creando bocana:', error);
      setErrors(prev => ({ ...prev, submit: 'Error al guardar. Intenta de nuevo.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="group inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Volver al listado
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Nueva Bocana</h1>
            <p className="text-gray-500">Registra una nueva penalidad para un jugador.</p>
          </div>
          <div className="hidden md:flex w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center text-primary">
            <PlusCircle size={24} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Selección de Jugador */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Jugador <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={jugadorQuery}
                  onChange={(e) => {
                    setJugadorQuery(e.target.value);
                    setShowSuggestions(true);
                    setForm(prev => ({ ...prev, jugador_id: '' }));
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={loadingJugadores ? 'Cargando lista...' : 'Buscar jugador por nombre...'}
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.jugador_id ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                
                {/* Sugerencias */}
                {showSuggestions && jugadorQuery && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredApostadores.length > 0 ? (
                      filteredApostadores.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({ ...prev, jugador_id: a.id }));
                            setJugadorQuery(a.fields.Nombre);
                            setShowSuggestions(false);
                            localStorage.setItem('ultimo_jugador_bocana', a.id);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {a.fields.Nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-gray-700 font-medium">{a.fields.Nombre}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        No se encontraron jugadores
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.jugador_id && <p className="text-sm text-red-500 mt-1">{errors.jugador_id}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Torneo */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Trophy size={16} className="text-gray-400" /> Torneo <span className="text-red-500">*</span>
                </label>
                <select
                  name="torneo"
                  value={form.torneo}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.torneo ? 'border-red-300' : 'border-gray-200'}`}
                >
                  <option value="">Seleccionar...</option>
                  {torneos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.torneo && <p className="text-sm text-red-500">{errors.torneo}</p>}
              </div>

              {/* Jornada */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" /> Jornada <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="jornada"
                  min="1"
                  value={form.jornada}
                  onChange={handleInputChange}
                  placeholder="Ej. 5"
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.jornada ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.jornada && <p className="text-sm text-red-500">{errors.jornada}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Bocana */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Tipo de Penalidad <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.tipo ? 'border-red-300' : 'border-gray-200'}`}
                >
                  <option value="">Seleccionar tipo...</option>
                  {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Estado Inicial
                </label>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  {['Pendiente', 'Pagada'].map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, status: statusOption as any }))}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        form.status === statusOption
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selección de Comida (Solo si es Pagada) */}
            {form.status === 'Pagada' && (
              <div className="p-5 bg-green-50 rounded-xl border border-green-100 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-4 text-green-800">
                  <Utensils size={18} />
                  <span className="font-semibold">Registro de Pago</span>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm text-green-700 font-medium">
                    ¿Qué comida pagó el jugador?
                  </label>
                  
                  {!isCustomComida ? (
                    <select
                      name="comida"
                      value={form.comida}
                      onChange={(e) => {
                        if (e.target.value === 'OTRO') {
                          setIsCustomComida(true);
                          setForm(prev => ({ ...prev, comida: '' }));
                        } else {
                          setForm(prev => ({ ...prev, comida: e.target.value }));
                        }
                      }}
                      className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">-- Seleccionar Comida --</option>
                      {comidasSugeridas.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="OTRO">✨ Otra comida distinta...</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={customComida}
                        onChange={(e) => setCustomComida(e.target.value)}
                        placeholder="Escribe el nombre de la comida..."
                        autoFocus
                        className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomComida(false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                  
                  {errors.comida && <p className="text-sm text-red-500">{errors.comida}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Registrar Bocana
                  <CheckCircle2 size={18} className="ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NuevaBocana;
