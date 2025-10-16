import { SignupForm } from '@/components/auth/signup-form';
import { Logo } from '@/components/icons/logo';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Logo className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            Create an Account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join EstateFlow to manage your properties and leads.
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
