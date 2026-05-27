'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
}

export default function NavLink({ href, icon, label, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-metric-label text-sm ${
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{ fontVariationSettings: isActive ? '"FILL" 1' : '"FILL" 0' }}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
