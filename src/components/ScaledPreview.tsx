import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clamp, cn } from '../lib/utils';

interface ScaledPreviewProps {
  /** Design width the children are authored at (px). */
  designWidth?: number;
  className?: string;
  /** Clip the preview to this many design-px of height (screenshot look). */
  clipHeight?: number;
  children: ReactNode;
}

/**
 * Renders children at a fixed design width and scales the whole thing down
 * to fit its container — so theme previews look like real website screenshots
 * at any size.
 */
export default function ScaledPreview({
  designWidth = 1280,
  className = '',
  clipHeight,
  children,
}: ScaledPreviewProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      const s = outer.clientWidth > 0 ? outer.clientWidth / designWidth : scale;
      setScale(s);
      setHeight(clamp(inner.scrollHeight * s, 0, 6000));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designWidth, children]);

  return (
    <div
      ref={outerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ height: clipHeight ? clipHeight * scale : height }}
    >
      <div
        ref={innerRef}
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}