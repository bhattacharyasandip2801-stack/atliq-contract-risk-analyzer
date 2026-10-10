import type { Metadata } from "next";
import Home from "@/components/Home";
import { getUser } from "@/lib/role";

export const metadata: Metadata = { title: "About this product" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  return <Home signedIn={!!(await getUser())} />;
}
