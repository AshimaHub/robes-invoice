import { PageLoader } from "@/components/page-loader";

export default function PortalLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <PageLoader label="Loading page" />
    </div>
  );
}
