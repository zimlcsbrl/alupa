'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { mainNav } from '@/lib/site';

export function SiteNav() {
  const pathname = usePathname();
  const menuId = useId();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenPath(null);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpenPath(null);
      }
    }
    const desktop = window.matchMedia('(min-width: 1001px)');
    const onResize = () => setOpenPath(null);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      desktop.removeEventListener('change', onResize);
    };
  }, [open]);

  return (
    <div className="site-navigation" ref={containerRef}>
      <button
        ref={buttonRef}
        className="nav-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpenPath(open ? null : pathname)}
      >
        <span>{open ? 'Fechar' : 'Menu'}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? <path d="m5 5 10 10M15 5 5 15" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
        </svg>
      </button>
      <nav id={menuId} className="primary-nav" data-open={open} aria-label="Navegação principal">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={
              pathname === item.href
                ? 'page'
                : pathname.startsWith(`${item.href}/`)
                  ? 'location'
                  : undefined
            }
            onClick={() => setOpenPath(null)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
