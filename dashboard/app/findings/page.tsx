import { Suspense } from "react";
import FindingsContent from "./FindingsContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <FindingsContent />
    </Suspense>
  );
}