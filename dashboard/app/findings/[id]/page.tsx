import { Suspense } from "react";
import FindingDetailContent from "./FindingDetailContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <FindingDetailContent />
    </Suspense>
  );
}