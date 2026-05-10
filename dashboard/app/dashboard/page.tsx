export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const HomeContent = dynamicImport(() => import("../HomeContent"), {
  ssr: false,
});

export default function Page() {
  return <HomeContent />;
}