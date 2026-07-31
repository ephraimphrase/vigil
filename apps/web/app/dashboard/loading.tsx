import { Loader } from "@/components/ui/Loader";


export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-base">
      <Loader />
    </div>
  );
}
