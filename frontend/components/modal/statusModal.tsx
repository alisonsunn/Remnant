"use client";

type StatusModalProps = {
  message: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function StatusModal({
  message,
  isOpen,
  setIsOpen,
}: StatusModalProps) {
  function handleAcknowledge() {
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-sm bg-white px-6 py-8 text-center shadow-lg">
        <div className="flex flex-col items-center">
          <p
            className="mb-6 whitespace-nowrap text-sm uppercase tracking-wider"
            style={{ color: "var(--color-label)" }}
          >
            {typeof message === "string" ? message : "Something went wrong."}
          </p>

          <button
            type="button"
            className="text-xs font-medium uppercase tracking-wide text-black no-underline underline-offset-4 transition-opacity hover:underline hover:opacity-80"
            onClick={handleAcknowledge}
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
}
