import ViewportGate from "@/components/ViewportGate";
import Desktop from "@/components/os/Desktop";

export default function Home() {
  return (
    <ViewportGate>
      <Desktop />
    </ViewportGate>
  );
}
