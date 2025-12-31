import { X, Wrench, ClipboardList, ShieldCheck, Hammer, RotateCcw, AlertOctagon, Battery, GraduationCap, MessageSquare } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicianName: string;
  onAssign: (type: string) => void;
}

export const TaskModal = ({ isOpen, onClose, technicianName, onAssign }: TaskModalProps) => {
  if (!isOpen) return null;

  const actions = [
    { id: 'Reparación', icon: Wrench, color: 'text-blue-600', border: 'border-blue-200', bg: 'hover:bg-blue-50' },
    { id: 'Presupuesto', icon: ClipboardList, color: 'text-teal-600', border: 'border-teal-200', bg: 'hover:bg-teal-50' },
    { id: 'Garantía', icon: ShieldCheck, color: 'text-green-600', border: 'border-green-200', bg: 'hover:bg-green-50' },
    { id: 'Desarme', icon: Hammer, color: 'text-cyan-600', border: 'border-cyan-200', bg: 'hover:bg-cyan-50' },
    { id: 'Rearme', icon: RotateCcw, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'hover:bg-emerald-50' },
    { id: 'Re-Work', icon: AlertOctagon, color: 'text-red-600', border: 'border-red-200', bg: 'hover:bg-red-50' },
    { id: 'Atención B90', icon: Battery, color: 'text-indigo-600', border: 'border-indigo-200', bg: 'hover:bg-indigo-50' },
    { id: 'Capacitación', icon: GraduationCap, color: 'text-pink-600', border: 'border-pink-200', bg: 'hover:bg-pink-50' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Header Modal */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide">Gestión de Tareas</h2>
            <p className="text-sm text-gray-500">Asignando actividad a: <span className="font-bold text-blue-600">{technicianName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X className="text-gray-500" />
          </button>
        </div>

        {/* Grid de Botones */}
        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAssign(action.id)}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 ${action.border} ${action.bg} bg-white transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group`}
            >
              <action.icon size={32} className={`${action.color} group-hover:scale-110 transition-transform`} strokeWidth={1.5} />
              <span className="font-bold text-gray-700 text-sm">{action.id}</span>
            </button>
          ))}
        </div>

        {/* Footer Acciones Extra */}
        <div className="p-6 bg-orange-50/30 border-t border-orange-100 flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-orange-50 border-2 border-orange-200 text-orange-700 rounded-xl font-bold hover:bg-orange-100 transition w-full sm:w-auto">
             <MessageSquare size={20} /> Enviar Mensaje
          </button>
          <button onClick={onClose} className="ml-auto text-gray-400 font-medium hover:text-gray-600 px-4">
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};