import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";

export default function Modal({ title, onClose, children, footer, wide }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [title, children]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={wide ? "max-w-[calc(100vw-2rem)] sm:max-w-[720px]" : "max-w-[calc(100vw-2rem)] sm:max-w-[460px]"}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="pr-2">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Tutup"
              className="h-8 w-8 shrink-0 rounded-full text-saas-text-muted hover:text-saas-text"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </div>
        </DialogHeader>
        <div className="px-3 sm:px-6 py-2 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
