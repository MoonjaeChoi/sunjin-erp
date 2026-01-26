// Generated: 2026-01-26 18:30:00 KST

// Minimal toast hook for inventory forms
export function useToast() {
  const toast = ({ variant, title, description }: any) => {
    const prefix = variant === 'destructive' ? '❌' : '✅';
    console.log(`${prefix} ${title}: ${description}`);
  };

  return { toast };
}
