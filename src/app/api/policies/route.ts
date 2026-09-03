import { NextResponse } from "next/server";
import { PolicyEngine } from "@/lib/policy/engine";

export async function GET() {
  return NextResponse.json({
    policies: PolicyEngine.DEFAULT_POLICIES,
  });
}
