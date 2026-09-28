import { redirect } from "next/navigation";

/** The solve profile moved to the Learning Hub; old links still land on it. */
export default function OldSolveProfilePage() {
  redirect("/hub/profile/");
}
