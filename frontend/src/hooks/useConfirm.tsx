import { useState, useRef } from "react";
import ConfirmModal from "@/components/modal/confirmModal";

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  function confirm(opts: ConfirmOptions) {
    console.log("confirm called with options:", opts);
    setIsOpen(true);
    setOptions(opts);

    return new Promise((resolve) => {
      console.log("Promise created, setting resolveRef");
      resolveRef.current = resolve;
    });
  }

  function onConfirm() {
    console.log("onConfirm called");
    setIsOpen(false);
    setOptions(null);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }

  function onCancel() {
    console.log("onCancel called");
    setIsOpen(false);
    setOptions(null);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }

  const confirmDialog = options ? (
    <ConfirmModal
      isOpen={isOpen}
      {...options}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  ) : null;

  return { confirm, confirmDialog };
}
