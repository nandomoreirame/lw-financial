import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@lw-financial/shared';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

const exampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type ExampleFormData = z.infer<typeof exampleSchema>;

async function fetchExampleData() {
  const response = await fetch('/api/example');
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

export default function ExampleRoute() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExampleFormData>({
    resolver: zodResolver(exampleSchema),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['example'],
    queryFn: fetchExampleData,
  });

  const onSubmit = (data: ExampleFormData) => {
    console.log('Form data:', data);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">Example Page</h1>

      {/* React Query Example */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">React Query Example</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </section>

      {/* React Hook Form Example */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">React Hook Form Example</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block">
              Name
            </label>
            <input
              id="name"
              {...register('name')}
              className="w-full rounded border px-3 py-2"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded border px-3 py-2"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      </section>
    </div>
  );
}
