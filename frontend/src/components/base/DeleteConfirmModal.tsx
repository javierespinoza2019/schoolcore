import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({ open, onClose, onConfirm, title, message, itemName, loading }: DeleteConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
          <i className="ri-delete-bin-line text-2xl text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-foreground-900 mb-1">{title}</h3>
        <p className="text-sm text-foreground-500 mb-1">{message}</p>
        {itemName && (
          <p className="text-sm font-semibold text-foreground-800 bg-secondary-50 rounded-md px-3 py-1.5 inline-block mt-1">
            {itemName}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={loading} icon="ri-delete-bin-line">
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
}