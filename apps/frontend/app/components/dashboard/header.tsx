/**
 * Header component for dashboard
 * Displays logo "LW Financial", bank icon, and logout button
 */

import { Button } from '@lw-financial/ui';
import { useAuth } from '../../hooks/use-auth';

/**
 * Header component with logo, icon, and logout button
 */
export function Header() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-background w-full border-b">
      <div className="container mx-auto max-w-4xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/bank.svg" alt="Bank icon" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">LW Financial</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
