import { ReactNode } from "react";

// Auth temporarily disabled — passes children straight through.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
