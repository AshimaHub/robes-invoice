import { redirect } from "next/navigation";

export default function LegacyBrandingRedirect() {
  redirect("/dashboard");
}
