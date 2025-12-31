import { NextResponse } from "next/server";
import { pinata } from "@/utils/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Convert JSON to File-like object
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], 'metadata.json', { type: 'application/json' });

    // Upload to IPFS using public upload
    const upload = await pinata.upload.public.file(file);

    // Get the gateway URL
    const url = await pinata.gateways.public.convert(upload.cid);

    return NextResponse.json({
      cid: upload.cid,
      url: url,
      ipfsUrl: `ipfs://${upload.cid}`
    }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Error uploading metadata" }, { status: 500 });
  }
}
