Next.js has a file size limit as to what can be pass through API routes, so another workaround is to upload the file on the client side. To do this securely you can make an API route that generates a temporary upload URL that is used in the upload request.
​
Start up Next.js Project
As with any Next.js project we can start one up with the following command
npx create-next-app@latest
After the project is created cd into the repo and install pinata
npm i pinata
After making the project, create a .env.local file in the root of the project and put in the following variables:
PINATA_JWT=
NEXT_PUBLIC_GATEWAY_URL=
Use the JWT from the API key creation in the previous step as well as the Gateway Domain. The format of the Gateway domain should be mydomain.mypinata.cloud.
​
Setup Pinata
Create a directory called utils in the root of the project and then make a file called config.ts inside of it. In that file we’ll export an instance of the Files SDK that we can use throughout the rest of the app.
utils/config.ts
"server only"

import { PinataSDK } from "pinata"

export const pinata = new PinataSDK({
  pinataJwt: `${process.env.PINATA_JWT}`,
  pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`
})
​
Create API Route
In order to upload on the client side we need to upload it securely without leaking our admin API key. To avoid this we’ll make an API route in our Next project under app/api/url/route.ts.
Once you have created that file you can paste in the following code.
app/api/url/route.ts
import { NextResponse } from "next/server";
import { pinata } from "@/utils/config"

export const dynamic = "force-dynamic";

export async function GET() {
  // If you're going to use auth you'll want to verify here
  try {
    const url = await pinata.upload.public.createSignedURL({
      expires: 30, // The only required param
    })
    return NextResponse.json({ url: url }, { status: 200 }); // Returns the signed upload URL
  } catch (error) {
    console.log(error);
    return NextResponse.json({ text: "Error creating API Key:" }, { status: 500 });
  }
}
When the client makes a GET request to /api/url it will return a temporary signed upload URL that is only valid for 30 seconds, which we can use on the client to make the upload request.
​
Create Client Side Form
Next we’ll want to make an upload form on the client side that will allow someone to select a file and upload it with the signed upload URL
In the /app/page.tsx file take out the boiler plate code and use the following.
app/page.tsx
"use client";

import { useState } from "react";
import { pinata } from "@/utils/config";

export default function Home() {
  const [file, setFile] = useState<File>();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async () => {
    if (!file) {
      alert("No file selected");
      return;
    }

    try {
      setUploading(true);
      const urlRequest = await fetch("/api/url"); // Fetches the temporary upload URL
      const urlResponse = await urlRequest.json(); // Parse response
      const upload = await pinata.upload.public
        .file(file)
        .url(urlResponse.url); // Upload the file with the signed URL
      console.log(upload);
      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target?.files?.[0]);
  };

  return (
    <main className="w-full min-h-screen m-auto flex flex-col justify-center items-center">
      <input type="file" onChange={handleChange} />
      <button type="button" disabled={uploading} onClick={uploadFile}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </main>
  );
}
The main thing to understand here is that we are able to use the url() method in combination with our upload methods which passes in the signed upload url instead of trying to access the admin key. We can take the response and create a URL to access the file.
app/page.tsx
"use client";

import { useState } from "react";
import { pinata } from "@/utils/config";

export default function Home() {
	const [file, setFile] = useState<File>();
	const [url, setUrl] = useState("");
	const [uploading, setUploading] = useState(false);

	const uploadFile = async () => {
		if (!file) {
			alert("No file selected");
			return;
		}

		try {
			setUploading(true);
			const urlRequest = await fetch("/api/url"); // Fetches the temporary upload URL
      const urlResponse = await urlRequest.json(); // Parse response
      const upload = await pinata.upload.public
        .file(file)
        .url(urlResponse.url); // Upload the file with the signed URL
      const fileUrl = await pinata.gateways.public.convert(upload.cid)
			setUrl(fileUrl);
			setUploading(false);
		} catch (e) {
			console.log(e);
			setUploading(false);
			alert("Trouble uploading file");
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFile(e.target?.files?.[0]);
	};

	return (
		<main className="w-full min-h-screen m-auto flex flex-col justify-center items-center">
			<input type="file" onChange={handleChange} />
			<button type="button" disabled={uploading} onClick={uploadFile}>
				{uploading ? "Uploading..." : "Upload"}
			</button>
			{url && <img src={url} alt="Image from Pinata" />}
		</main>
	);
}