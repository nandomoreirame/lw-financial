import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@lw-financial/shared';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

// Example schema using shared Zod
const exampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type ExampleFormData = z.infer<typeof exampleSchema>;

// Example API function
async function fetchExampleData() {
  const response = await fetch('/api/example');
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

export default function ExampleRoute() {
  // React Hook Form example
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExampleFormData>({
    resolver: zodResolver(exampleSchema),
  });

  // React Query example
  const { data, isLoading, error } = useQuery({
    queryKey: ['example'],
    queryFn: fetchExampleData,
  });

  const onSubmit = (data: ExampleFormData) => {
    console.log('Form data:', data);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Example Page</h1>

      {/* React Query Example */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">React Query Example</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </section>

      {/* React Hook Form Example */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">React Hook Form Example</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="name" className="block mb-1">
              Name
            </label>
            <input
              id="name"
              {...register('name')}
              className="w-full px-3 py-2 border rounded"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border rounded"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      </section>
    </div>
  );
}
