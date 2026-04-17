import { Modal, ModalBody } from './ui';

interface TxPendingModalProps {
  open: boolean;
  message?: string;
}

export function TxPendingModal({ open, message = 'Confirm in MetaMask' }: TxPendingModalProps) {
  return (
    <Modal open={open} onClose={() => {}} showCloseButton={false} closeOnBackdropClick={false} closeOnEscape={false} size="sm">
      <ModalBody padding="lg">
        <div className="text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-amber-400 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Transaction Pending</h3>
          <p className="text-sm text-neutral-400">{message}</p>
          <div className="mt-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-neutral-600 border-t-amber-400 rounded-full animate-spin" />
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
