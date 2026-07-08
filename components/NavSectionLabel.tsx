interface NavSectionLabelProps {
  label: string;
}

export default function NavSectionLabel({ label }: NavSectionLabelProps) {
  return (
    <p className="px-4 pt-4 pb-1 font-caption text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
      {label}
    </p>
  );
}
