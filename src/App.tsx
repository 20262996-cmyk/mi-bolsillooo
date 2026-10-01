/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  PlusCircle,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  TrendingDown,
  Sparkles,
  Utensils,
  Bus,
  BookOpen,
  Coffee,
  Home,
  HelpCircle,
  Edit3,
  Check,
  X,
  Download,
  CalendarDays,
  Info,
  Brain,
  PiggyBank,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

export type ExpenseCategory =
  | 'Comida'
  | 'Transporte'
  | 'Estudio y Fotocopias'
  | 'Salidas y Café'
  | 'Servicios y Renta'
  | 'Otros';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO string YYYY-MM-DD
  week: string; // Semana a la que pertenece (ej. "Semana 29 sep - 5 oct")
  note?: string;
}

// Estructura fija de respuesta de la IA (Sello de IA)
export interface WeeklyAiAdvice {
  resumen: string;
  categoriaRecorte: string;
  gastoActual: number;
  ahorroSugerido: number;
  nuevoGastoSugerido: number;
  motivo: string;
}

// JSON de ejemplo para probar la interfaz sin gastar una llamada a Gemini
export const MOCK_AI_ADVICE: WeeklyAiAdvice = {
  resumen: 'Esta semana el 45% de tus consumos se concentró en café y bocadillos comprados entre clases.',
  categoriaRecorte: 'Salidas y Café',
  gastoActual: 28000,
  ahorroSugerido: 12000,
  nuevoGastoSugerido: 16000,
  motivo: 'Llevar tu propio termo de café a la universidad 3 días a la semana te permite ahorrar $12.000 sin renunciar a compartir salidas con tus compañeros el fin de semana.'
};

const CATEGORIES: { name: ExpenseCategory; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { name: 'Comida', icon: Utensils, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { name: 'Transporte', icon: Bus, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { name: 'Estudio y Fotocopias', icon: BookOpen, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { name: 'Salidas y Café', icon: Coffee, color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { name: 'Servicios y Renta', icon: Home, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { name: 'Otros', icon: HelpCircle, color: 'bg-slate-200 text-slate-800 border-slate-300' },
];

// Helper para obtener la fecha de hoy en formato YYYY-MM-DD
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper para obtener el nombre legible de la semana (Lunes a Domingo) para cualquier fecha
export function getWeekForDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day, 12, 0, 0);
  const dayOfWeek = targetDate.getDay();
  // En JS: Domingo es 0, Lunes es 1, ..., Sábado es 6.
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShort = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return `Semana ${formatShort(monday)} - ${formatShort(sunday)}`;
}

// Helper para calcular el rango de la semana actual
function getCurrentWeekRange(): { start: Date; end: Date; startStr: string; endStr: string; currentWeekLabel: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return {
    start: monday,
    end: sunday,
    startStr: formatDate(monday),
    endStr: formatDate(sunday),
    currentWeekLabel: `Semana ${formatDate(monday)} - ${formatDate(sunday)}`
  };
}

function isDateInCurrentWeek(dateStr: string, weekStart: Date, weekEnd: Date): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  const expenseDate = new Date(year, month - 1, day, 12, 0, 0);
  return expenseDate >= weekStart && expenseDate <= weekEnd;
}

export default function App() {
  // 1. Lectura inicial desde localStorage al abrir la aplicación
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('mi_bolsillo_gastos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            week: item.week || getWeekForDate(item.date)
          }));
        }
      } catch (e) {
        console.error('Error al leer gastos desde localStorage:', e);
      }
    }
    const today = getTodayString();
    const currentWeekTag = getWeekForDate(today);
    return [
      {
        id: '1',
        amount: 8500,
        category: 'Comida',
        date: today,
        week: currentWeekTag,
        note: 'Menú estudiantil universitario'
      },
      {
        id: '2',
        amount: 3200,
        category: 'Transporte',
        date: today,
        week: currentWeekTag,
        note: 'Tarjeta de metro/bus'
      },
      {
        id: '3',
        amount: 4500,
        category: 'Estudio y Fotocopias',
        date: today,
        week: currentWeekTag,
        note: 'Guía de laboratorio y copias'
      }
    ];
  });

  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('mi_bolsillo_meta_semanal');
    return saved ? Number(saved) : 50000;
  });

  // Estado para editar la meta
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<string>(weeklyGoal.toString());

  // Formulario para registrar nuevo gasto
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Comida');
  const [date, setDate] = useState<string>(getTodayString());
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Estados del Asesor de Inteligencia Artificial (Sello IA)
  const [aiAdvice, setAiAdvice] = useState<WeeklyAiAdvice | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  // Filtro de vista
  const [filterView, setFilterView] = useState<'semana' | 'todos'>('semana');

  // Guardar automáticamente en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mi_bolsillo_gastos', JSON.stringify(expenses));
    } catch (e) {
      console.error('Error al guardar gastos en localStorage:', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('mi_bolsillo_meta_semanal', weeklyGoal.toString());
    } catch (e) {
      console.error('Error al guardar meta en localStorage:', e);
    }
  }, [weeklyGoal]);

  // Rango de la semana actual
  const currentWeek = useMemo(() => getCurrentWeekRange(), []);

  // Gastos de la semana actual
  const currentWeekExpenses = useMemo(() => {
    return expenses.filter(exp => isDateInCurrentWeek(exp.date, currentWeek.start, currentWeek.end));
  }, [expenses, currentWeek]);

  // Total gastado en la semana actual
  const totalWeeklySpent = useMemo(() => {
    return currentWeekExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [currentWeekExpenses]);

  // Porcentaje consumido de la meta
  const spentPercentage = weeklyGoal > 0 ? (totalWeeklySpent / weeklyGoal) * 100 : 0;
  const remainingBudget = weeklyGoal - totalWeeklySpent;

  // Lógica del Semáforo
  const trafficStatus = useMemo<'green' | 'yellow' | 'red'>(() => {
    if (spentPercentage < 70) return 'green';
    if (spentPercentage < 100) return 'yellow';
    return 'red';
  }, [spentPercentage]);

  // Manejar adición de gasto con 'semana'
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Por favor, escribe un monto mayor a cero para continuar.');
      setSuccessMessage('');
      return;
    }

    if (!date) {
      setFormError('Por favor, selecciona una fecha válida en el calendario.');
      setSuccessMessage('');
      return;
    }

    const calculatedWeek = getWeekForDate(date);

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parsedAmount,
      category,
      date,
      week: calculatedWeek,
      note: note.trim() || undefined
    };

    setExpenses(prev => [newExpense, ...prev]);
    setAmount('');
    setNote('');
    setFormError('');
    setSuccessMessage('¡Gasto guardado con éxito! Tu semáforo y presupuesto se actualizaron.');

    setTimeout(() => {
      setSuccessMessage('');
    }, 4500);
  };

  // Borrar un gasto
  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
    setSuccessMessage('El gasto fue eliminado correctamente.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Guardar meta
  const handleSaveGoal = () => {
    const parsed = parseFloat(tempGoal);
    if (!isNaN(parsed) && parsed > 0) {
      setWeeklyGoal(parsed);
      setIsEditingGoal(false);
      setSuccessMessage('¡Nueva meta semanal guardada!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setFormError('Por favor, ingresa una meta válida mayor a cero.');
    }
  };

  // Exportar copia de seguridad
  const handleExportBackup = () => {
    const backupData = {
      app: 'MI BOLSILLO',
      version: 'M2',
      fechaExportacion: new Date().toISOString(),
      metaSemanal: weeklyGoal,
      totalGastos: expenses.length,
      gastos: expenses
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mi_bolsillo_backup_${getTodayString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // LLAMADA AL BACKEND PARA ANALIZAR GASTOS CON GEMINI (SELLO IA)
  const handleAnalyzeWithAi = async () => {
    if (currentWeekExpenses.length === 0) {
      setAiError('No hay gastos registrados en esta semana para que la IA los analice. Agrega al menos un gasto.');
      return;
    }

    setIsAiLoading(true);
    setAiError('');

    try {
      const response = await fetch('/api/analyze-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyGoal,
          expenses: currentWeekExpenses,
          weekLabel: currentWeek.currentWeekLabel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un inconveniente al consultar a la IA.');
      }

      setAiAdvice(data);
    } catch (err: any) {
      console.error('Error al consultar a la IA:', err);
      // Mensaje en español sencillo; la app continúa funcionando con normalidad
      setAiError(
        err.message || 'No fue posible conectar con la IA en este momento. Tu semáforo y tus gastos siguen funcionando con total normalidad.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Cargar JSON de ejemplo sin gastar una llamada a Gemini
  const handleLoadMockAiAdvice = () => {
    setAiAdvice(MOCK_AI_ADVICE);
    setAiError('');
    setSuccessMessage('Ejemplo de recomendación de IA cargado con éxito.');
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // Formateador de moneda amigable
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Gastos según filtro
  const displayedExpenses = filterView === 'semana' ? currentWeekExpenses : expenses;

  // Agrupación de gastos por semana
  const expensesGroupedByWeek = useMemo(() => {
    const groups: { [weekLabel: string]: Expense[] } = {};
    displayedExpenses.forEach(exp => {
      const weekKey = exp.week || getWeekForDate(exp.date);
      if (!groups[weekKey]) {
        groups[weekKey] = [];
      }
      groups[weekKey].push(exp);
    });
    return groups;
  }, [displayedExpenses]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 antialiased">
      {/* HEADER SUPERIOR (Adaptado a móviles desde 320px) */}
      <header className="bg-indigo-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight flex items-center gap-2">
                  MI BOLSILLO
                </h1>
                <p className="text-base text-indigo-100 font-medium">Finanzas para Estudiantes</p>
              </div>
            </div>

            {/* Botón secundario de respaldo */}
            <button
              onClick={handleExportBackup}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-800/90 hover:bg-indigo-800 border-2 border-indigo-400/50 text-white text-base font-semibold shadow-sm active:scale-95 transition min-h-[44px]"
              title="Descargar copia de seguridad en archivo"
            >
              <Download className="w-5 h-5 text-indigo-200" />
              <span className="hidden xs:inline">Respaldo</span>
            </button>
          </div>

          {/* Selector secundario de vista semanal */}
          <div className="flex bg-indigo-900/80 p-1.5 rounded-xl border border-indigo-500/40">
            <button
              type="button"
              onClick={() => setFilterView('semana')}
              className={`flex-1 py-2.5 px-2 rounded-lg text-base font-bold text-center transition min-h-[44px] ${
                filterView === 'semana'
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={() => setFilterView('todos')}
              className={`flex-1 py-2.5 px-2 rounded-lg text-base font-bold text-center transition min-h-[44px] ${
                filterView === 'todos'
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              Historial ({expenses.length})
            </button>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-5">
        {/* MENSAJES DE ESTADO VISIBLES EN ESPAÑOL SENCILLO */}
        {formError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-100 border-2 border-rose-400 text-rose-950 text-base font-semibold flex items-start gap-3 shadow-sm"
          >
            <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
            <button
              onClick={() => setFormError('')}
              type="button"
              className="p-1 text-rose-700 hover:text-rose-950 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cerrar mensaje de error"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-950 text-base font-semibold flex items-start gap-3 shadow-sm"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
            <button
              onClick={() => setSuccessMessage('')}
              type="button"
              className="p-1 text-emerald-800 hover:text-emerald-950 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cerrar mensaje de confirmación"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 1. SECCIÓN DE META Y SEMÁFORO */}
        <section className="bg-white rounded-3xl shadow-sm border-2 border-slate-300 overflow-hidden">
          {/* Cabecera de la Meta Semanal con Etiqueta Visible */}
          <div className="p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label htmlFor="input-meta-semanal" className="text-base font-extrabold text-slate-800 block">
                Meta de Gasto Semanal:
              </label>
              <span className="text-base font-bold text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
                {currentWeek.startStr} al {currentWeek.endStr}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              {isEditingGoal ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xl font-bold text-slate-700">$</span>
                  <input
                    id="input-meta-semanal"
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="flex-1 sm:w-44 px-3.5 py-2.5 text-lg font-black border-2 border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-h-[48px]"
                    autoFocus
                  />
                  {/* Botón secundario para guardar meta */}
                  <button
                    onClick={handleSaveGoal}
                    type="button"
                    className="px-3.5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 active:scale-95 font-bold text-base min-h-[48px] flex items-center justify-center gap-1 shadow"
                    title="Guardar meta"
                  >
                    <Check className="w-5 h-5" />
                    <span>Listo</span>
                  </button>
                  {/* Botón secundario para cancelar */}
                  <button
                    onClick={() => {
                      setTempGoal(weeklyGoal.toString());
                      setIsEditingGoal(false);
                    }}
                    type="button"
                    className="px-3.5 py-2.5 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 font-bold text-base min-h-[48px] flex items-center justify-center"
                    title="Cancelar edición"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {formatCurrency(weeklyGoal)}
                  </span>
                  {/* Botón secundario visible */}
                  <button
                    onClick={() => {
                      setTempGoal(weeklyGoal.toString());
                      setIsEditingGoal(true);
                    }}
                    type="button"
                    className="text-base text-slate-800 hover:text-indigo-900 font-bold flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border-2 border-slate-300 hover:border-indigo-400 active:scale-95 transition min-h-[48px]"
                  >
                    <Edit3 className="w-4 h-4 text-indigo-700" />
                    <span>Fijar meta</span>
                  </button>
                </div>
              )}
            </div>

            {/* Resumen de gasto semanal */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-base font-semibold text-slate-600 block">Gastado:</span>
                <span className="text-lg font-black text-slate-950 block">
                  {formatCurrency(totalWeeklySpent)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-base font-semibold text-slate-600 block">
                  {remainingBudget >= 0 ? 'Disponible:' : 'Te pasaste por:'}
                </span>
                <span
                  className={`text-lg font-black block ${
                    remainingBudget >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(Math.abs(remainingBudget))}
                </span>
              </div>
            </div>
          </div>

          {/* Representación del Semáforo */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Semáforo físico con alto contraste y luces táctiles */}
              <div className="bg-slate-950 p-3 rounded-3xl shadow-lg flex sm:flex-col gap-3.5 border-2 border-slate-800">
                {/* Luz Roja */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    trafficStatus === 'red'
                      ? 'bg-rose-500 shadow-[0_0_24px_rgba(244,63,94,1)] ring-4 ring-rose-300 scale-110'
                      : 'bg-rose-950/70 opacity-30'
                  }`}
                  aria-label="Luz roja de alerta de presupuesto"
                >
                  <AlertOctagon className={`w-7 h-7 ${trafficStatus === 'red' ? 'text-white' : 'text-rose-700'}`} />
                </div>

                {/* Luz Amarilla */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    trafficStatus === 'yellow'
                      ? 'bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,1)] ring-4 ring-amber-200 scale-110'
                      : 'bg-amber-950/70 opacity-30'
                  }`}
                  aria-label="Luz amarilla de precaución"
                >
                  <AlertTriangle className={`w-7 h-7 ${trafficStatus === 'yellow' ? 'text-amber-950' : 'text-amber-700'}`} />
                </div>

                {/* Luz Verde */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    trafficStatus === 'green'
                      ? 'bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,1)] ring-4 ring-emerald-200 scale-110'
                      : 'bg-emerald-950/70 opacity-30'
                  }`}
                  aria-label="Luz verde de control presupuestal"
                >
                  <CheckCircle2 className={`w-7 h-7 ${trafficStatus === 'green' ? 'text-white' : 'text-emerald-700'}`} />
                </div>
              </div>

              {/* Mensaje descriptivo con texto mayor o igual a 16px */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`text-base font-black px-3.5 py-1.5 rounded-full border-2 ${
                      trafficStatus === 'green'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                        : trafficStatus === 'yellow'
                        ? 'bg-amber-100 text-amber-950 border-amber-400'
                        : 'bg-rose-100 text-rose-950 border-rose-400'
                    }`}
                  >
                    {trafficStatus === 'green' && 'Semáforo Verde: Buen Ritmo'}
                    {trafficStatus === 'yellow' && 'Semáforo Amarillo: Atención'}
                    {trafficStatus === 'red' && 'Semáforo Rojo: Límite Superado'}
                  </span>
                  <span className="text-base font-extrabold text-slate-800">
                    {spentPercentage.toFixed(0)}% de tu meta
                  </span>
                </div>

                {/* Barra de progreso visual */}
                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      trafficStatus === 'green'
                        ? 'bg-emerald-500'
                        : trafficStatus === 'yellow'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </div>

                {/* Explicación en español claro y texto >= 16px */}
                <div
                  className={`p-3.5 rounded-2xl text-base font-medium leading-relaxed border-2 ${
                    trafficStatus === 'green'
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                      : trafficStatus === 'yellow'
                      ? 'bg-amber-50 text-amber-950 border-amber-300'
                      : 'bg-rose-50 text-rose-950 border-rose-300'
                  }`}
                >
                  {trafficStatus === 'green' && (
                    <p>
                      <strong>¡Vas excelente!</strong> Has gastado menos del 70% de tu dinero semanal. Te quedan{' '}
                      <strong>{formatCurrency(remainingBudget)}</strong> disponibles.
                    </p>
                  )}
                  {trafficStatus === 'yellow' && (
                    <p>
                      <strong>¡Precaución!</strong> Ya consumiste más del 70% de tu meta. Solo te quedan{' '}
                      <strong>{formatCurrency(remainingBudget)}</strong> para los días restantes.
                    </p>
                  )}
                  {trafficStatus === 'red' && (
                    <p>
                      <strong>¡Cuidado con el bolsillo!</strong> Alcanzaste o superaste tu meta semanal por{' '}
                      <strong>{formatCurrency(Math.abs(remainingBudget))}</strong>. Evita gastos nuevos hasta el próximo lunes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SECCIÓN DEL SELLO IA: ASESOR INTELIGENTE PARA RECORTAR SIN SACRIFICAR LO NECESARIO */}
        <section className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border-2 border-indigo-200 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Asesor de Bolsillo IA
                </h2>
                <p className="text-base text-slate-600">Propuesta de recorte con montos concretos</p>
              </div>
            </div>

            <span className="text-base font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Sello IA
            </span>
          </div>

          {/* Botones de acción del Asesor IA */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={handleAnalyzeWithAi}
              disabled={isAiLoading}
              type="button"
              className="flex-1 py-3 px-4 bg-indigo-900 hover:bg-indigo-950 active:scale-95 text-white font-bold rounded-2xl shadow transition flex items-center justify-center gap-2 text-base min-h-[48px] disabled:opacity-50"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-300" />
                  <span>La IA está analizando tu semana...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Analizar gastos de la semana con IA</span>
                </>
              )}
            </button>

            <button
              onClick={handleLoadMockAiAdvice}
              type="button"
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl border-2 border-slate-300 active:scale-95 transition text-base min-h-[48px]"
              title="Cargar ejemplo de recomendación sin consumir llamadas a Gemini"
            >
              Probar con ejemplo
            </button>
          </div>

          {/* Mensaje de error de la IA (no bloquea el resto de la app) */}
          {aiError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-base flex items-start gap-2.5"
            >
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{aiError}</div>
              <button
                onClick={() => setAiError('')}
                className="text-amber-800 hover:text-amber-950 p-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* DESPLIEGUE ESTRUCTURADO DE LA RESPUESTA DE LA IA (CAMPOS INDIVIDUALES) */}
          {aiAdvice && (
            <div className="space-y-3.5 pt-2 border-t-2 border-indigo-100">
              {/* 1. Resumen general */}
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200">
                <span className="text-base font-extrabold text-indigo-900 block mb-1">
                  Resumen de la semana:
                </span>
                <p className="text-base text-slate-800 leading-relaxed font-medium">
                  {aiAdvice.resumen}
                </p>
              </div>

              {/* 2. Categoría a recortar y desglose de montos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-200">
                  <span className="text-base font-bold text-amber-900 block">
                    Categoría sugerida para recortar:
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="w-5 h-5 text-amber-700 shrink-0" />
                    <span className="text-lg font-black text-amber-950">
                      {aiAdvice.categoriaRecorte}
                    </span>
                  </div>
                  <p className="text-base text-slate-700 mt-1">
                    Gasto actual: <strong>{formatCurrency(aiAdvice.gastoActual)}</strong>
                  </p>
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-2xl border-2 border-emerald-300">
                  <span className="text-base font-bold text-emerald-900 block">
                    Ahorro sugerido concreto:
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <PiggyBank className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span className="text-xl font-black text-emerald-700">
                      {formatCurrency(aiAdvice.ahorroSugerido)}
                    </span>
                  </div>
                  <p className="text-base text-slate-700 mt-1">
                    Nuevo gasto sugerido:{' '}
                    <strong className="text-slate-900">
                      {formatCurrency(aiAdvice.nuevoGastoSugerido)}
                    </strong>
                  </p>
                </div>
              </div>

              {/* 3. Motivo y consejo para no sacrificar lo necesario */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-300">
                <span className="text-base font-extrabold text-slate-900 block mb-1">
                  Cómo recortar sin sacrificar lo esencial:
                </span>
                <p className="text-base text-slate-700 leading-relaxed font-medium">
                  {aiAdvice.motivo}
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setAiAdvice(null)}
                  type="button"
                  className="text-base font-semibold text-slate-500 hover:text-slate-800 underline p-1 min-h-[44px]"
                >
                  Ocultar recomendación
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. FORMULARIO DE REGISTRO (Con etiquetas visibles y UN SOLO BOTÓN PRINCIPAL) */}
        <section className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border-2 border-slate-300">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-indigo-700" />
            Registrar un Gasto Estudiantil
          </h2>

          <form onSubmit={handleAddExpense} className="space-y-4">
            {/* Campo 1 con Etiqueta Visible: Monto */}
            <div>
              <label htmlFor="input-monto-gasto" className="block text-base font-bold text-slate-900 mb-1.5">
                Monto del gasto en pesos ($):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-600 font-bold text-lg">$</span>
                <input
                  id="input-monto-gasto"
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ejemplo: 12000"
                  className="w-full pl-9 pr-3.5 py-3 text-base font-bold rounded-2xl border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 min-h-[48px] bg-white text-slate-900"
                  required
                />
              </div>

              {/* Botones secundarios rápidos para estudiantes */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {[2000, 5000, 10000, 20000].map(quickAmount => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="text-base font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-800 px-3 py-2 rounded-xl border border-slate-300 active:scale-95 transition min-h-[44px]"
                  >
                    +${quickAmount >= 1000 ? `${quickAmount / 1000}k` : quickAmount}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo 2 con Etiqueta Visible: Categoría */}
            <div>
              <label className="block text-base font-bold text-slate-900 mb-1.5">
                Selecciona la categoría del gasto:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl text-base font-bold border-2 text-left transition min-h-[48px] ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-400'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo 3 con Etiqueta Visible: Fecha */}
            <div>
              <label htmlFor="input-fecha-gasto" className="block text-base font-bold text-slate-900 mb-1.5">
                Fecha del gasto:
              </label>
              <input
                id="input-fecha-gasto"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-3 text-base font-bold rounded-2xl border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 min-h-[48px] bg-white text-slate-900"
                required
              />
              {date && (
                <p className="text-base text-indigo-900 font-semibold mt-1.5 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-indigo-700 shrink-0" />
                  Corresponde a: <strong>{getWeekForDate(date)}</strong>
                </p>
              )}
            </div>

            {/* Campo 4 con Etiqueta Visible: Nota opcional */}
            <div>
              <label htmlFor="input-nota-gasto" className="block text-base font-bold text-slate-900 mb-1.5">
                Detalle o nota (opcional):
              </label>
              <input
                id="input-nota-gasto"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ejemplo: Fotocopias de cálculo o almuerzo"
                className="w-full px-3.5 py-3 text-base rounded-2xl border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 min-h-[48px] bg-white text-slate-900"
              />
            </div>

            {/* ÚNICO BOTÓN PRINCIPAL DE LA PANTALLA */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 active:scale-[0.98] text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-base sm:text-lg min-h-[52px]"
              >
                <PlusCircle className="w-5 h-5 text-white" />
                <span>Guardar Gasto</span>
              </button>
            </div>
          </form>
        </section>

        {/* 4. HISTORIAL DE GASTOS CON ESTADO VACÍO CLARO */}
        <section className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border-2 border-slate-300 flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-700" />
                {filterView === 'semana' ? 'Gastos de Esta Semana' : 'Historial Completo'}
              </h2>
              <span className="text-base text-slate-600 font-medium">
                {displayedExpenses.length} registro(s) encontrado(s)
              </span>
            </div>

            {displayedExpenses.length > 0 && (
              <span className="text-base font-extrabold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                Total: {formatCurrency(displayedExpenses.reduce((s, i) => s + i.amount, 0))}
              </span>
            )}
          </div>

          {/* Listado o Estado Vacío */}
          <div className="space-y-4">
            {displayedExpenses.length === 0 ? (
              /* ESTADO VACÍO: Con instrucción clara de qué hacer primero */
              <div className="text-center py-8 px-4 border-2 border-dashed border-indigo-200 rounded-3xl bg-indigo-50/50 space-y-3">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Todavía no tienes gastos registrados
                </h3>
                <div className="p-3.5 bg-white rounded-2xl border border-indigo-100 max-w-md mx-auto text-left space-y-1.5 shadow-sm">
                  <p className="text-base font-bold text-indigo-950 flex items-center gap-1.5">
                    <Info className="w-5 h-5 text-indigo-600 shrink-0" />
                    ¿Qué debes hacer primero?
                  </p>
                  <p className="text-base text-slate-700 leading-relaxed">
                    1. En el formulario de arriba, escribe el <strong>monto</strong> de tu primer gasto.
                    <br />
                    2. Elige una <strong>categoría</strong> (ej. Comida o Transporte).
                    <br />
                    3. Presiona el botón azul <strong>"Guardar Gasto"</strong>.
                  </p>
                  <p className="text-base text-slate-600 italic pt-1">
                    Tu gasto se guardará automáticamente y tu semáforo calculará tu saldo disponible.
                  </p>
                </div>
              </div>
            ) : (
              /* Lista agrupada por semana */
              Object.entries(expensesGroupedByWeek).map(([weekTitle, items]) => {
                const weekTotal = items.reduce((acc, curr) => acc + curr.amount, 0);

                return (
                  <div key={weekTitle} className="space-y-2.5">
                    {/* Cabecera del grupo semanal */}
                    <div className="flex items-center justify-between bg-slate-100 border-2 border-slate-200 px-3.5 py-2.5 rounded-2xl text-base font-bold text-slate-900">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-indigo-700" />
                        {weekTitle}
                      </span>
                      <span className="text-base text-slate-700 font-semibold">
                        Total: <strong>{formatCurrency(weekTotal)}</strong>
                      </span>
                    </div>

                    {/* Tarjetas de gastos con área táctil cómoda */}
                    <div className="space-y-2">
                      {items.map((expense) => {
                        const catConfig = CATEGORIES.find(c => c.name === expense.category) || CATEGORIES[5];
                        const Icon = catConfig.icon;

                        return (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 transition gap-3"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 ${catConfig.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-base font-bold text-slate-900 truncate">
                                  {expense.note || expense.category}
                                </p>
                                <div className="flex items-center gap-2 text-base text-slate-600">
                                  <span className="font-semibold text-slate-700">{expense.category}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    {expense.date}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-base sm:text-lg font-black text-slate-950">
                                {formatCurrency(expense.amount)}
                              </span>
                              {/* Botón secundario para eliminar */}
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                type="button"
                                className="text-slate-500 hover:text-rose-700 p-2.5 rounded-xl hover:bg-rose-50 active:scale-95 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title="Eliminar gasto"
                                aria-label="Eliminar este gasto"
                              >
                                <Trash2 className="w-5 h-5 text-rose-600" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* PIE INFORMATIVO */}
        <footer className="bg-slate-200 border-2 border-slate-300 rounded-3xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="text-base text-slate-900 font-medium">
            <strong>Asesoría financiera estudiantil:</strong> Consulta el Asesor IA para detectar fugas de dinero hormiga antes de finalizar la semana.
          </div>
        </footer>
      </main>
    </div>
  );
}
