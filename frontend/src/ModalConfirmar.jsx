// Ventana para confirmar acciones que no se pueden deshacer (eliminar)
export function ModalConfirmar({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <p className="text-5xl text-center mb-4">⚠️</p>
        <p className="text-gray-700 font-medium text-center mb-6 text-sm leading-relaxed">{mensaje}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancelar}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition text-sm">
            Cancelar
          </button>
          <button onClick={onConfirmar}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition text-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
