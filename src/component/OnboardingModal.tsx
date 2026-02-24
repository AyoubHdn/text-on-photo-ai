import React, { useEffect, useState } from "react";

type OnboardingModalProps = {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  ctaLabel: string;
  onCta: () => void;
  onClose?: () => void;
  footerText?: string;
  showCloseButton?: boolean;
};

export function OnboardingModal({
  isOpen,
  title,
  description,
  ctaLabel,
  onCta,
  onClose,
  footerText,
  showCloseButton = true,
}: OnboardingModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={showCloseButton ? handleClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl transition-all duration-200 dark:border-gray-700 dark:bg-gray-900 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close"
            >
              x
            </button>
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">{description}</div>
        <button
          type="button"
          onClick={onCta}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {ctaLabel}
        </button>
        {footerText && (
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">{footerText}</p>
        )}
      </div>
    </div>
  );
}
