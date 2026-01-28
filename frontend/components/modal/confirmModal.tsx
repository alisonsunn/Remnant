import { ReactNode } from "react";

export type ConfirmModalProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-[var(--color-muted)] bg-opacity-50">
      <section className="flex flex-col gap-4 bg-white max-w-sm w-full p-12 text-center">
        <h3 className="text-3xl">{title}</h3>
        {message && (
          <p className="normal italic px-4 text-[0.625rem] text-[var(--color-h2)]">
            {message}
          </p>
        )}
        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={onCancel}
            className="py-3.5 px-8 border border-black bg-transparent text-[10px] tracking-[0.4em] uppercase text-black transition-colors duration-200 hover:bg-[var(--color-hover)]"
          >
            {cancelText}
          </button>
          <button onClick={onConfirm}>
            <h2 className="normal delete">{confirmText}</h2>
          </button>
        </div>
      </section>
    </main>
  );
}
