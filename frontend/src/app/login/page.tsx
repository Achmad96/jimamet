import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Masuk / Registrasi | Jimamet Clinical",
  description: "Masuk ke portal analisis nutrisi dan dietetika Jimamet.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-surface">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
