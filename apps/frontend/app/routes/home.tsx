import type { Route } from './+types/home';
import { Welcome } from '../welcome/welcome';
import { Button } from '@monorepo/ui';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <Welcome />

      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="rounded-3xl border border-gray-200 dark:border-gray-700 p-8 space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
            Shadcn UI Button Examples
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variants
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                States
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button>Enabled</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
