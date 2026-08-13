import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Maximize, Minimize } from 'lucide-react';

export default function MapFullscreenButton({ containerRef }) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = () => {
    const el = containerRef?.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={toggle}
      className="text-xs h-7 px-2"
    >
      {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
    </Button>
  );
}
