import { NextResponse } from "next/server";

const DEFAULT_UPSTREAM_BASE_URL = "https://scraping-6z8n0y0ar-iti1.vercel.app";

function getUpstreamBaseUrl() {
  return process.env.UPSTREAM_SCRAPER_BASE_URL || DEFAULT_UPSTREAM_BASE_URL;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const upstreamBase = getUpstreamBaseUrl();

    const upstreamUrl = new URL("/vinted/sold", upstreamBase);
    upstreamUrl.search = url.search;

    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await upstreamRes.json()
      : await upstreamRes.text();

    return NextResponse.json(body, { status: upstreamRes.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

