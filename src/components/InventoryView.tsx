import { Search, AlertTriangle } from 'lucide-react';

export const InventoryView = () => {
  // Datos falsos para demo
  const items = [
    { sku: 'MK-10293', nombre: 'Carbones CB-303', stock: 150, estado: 'OK' },
    { sku: 'MK-55921', nombre: 'Inducido HM0870C', stock: 2, estado: 'BAJO' },
    { sku: 'MK-99201', nombre: 'Interruptor TG72B', stock: 45, estado: 'OK' },
    { sku: 'MK-11002', nombre: 'Grasa Makita 30g', stock: 0, estado: 'CRITICO' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Inventario de Repuestos</h2>
        <div className="bg-white border rounded-lg flex items-center px-3 py-2 shadow-sm">
          <Search size={18} className="text-gray-400 mr-2" />
          <input type="text" placeholder="Buscar SKU..." className="outline-none text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="p-4">SKU</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-xs text-gray-500">{item.sku}</td>
                <td className="p-4 font-bold text-gray-700">{item.nombre}</td>
                <td className="p-4">{item.stock} un.</td>
                <td className="p-4">
                  {item.estado === 'BAJO' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold flex w-fit items-center gap-1"><AlertTriangle size={12}/> BAJO</span>}
                  {item.estado === 'CRITICO' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">SIN STOCK</span>}
                  {item.estado === 'OK' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};