import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
const http = httpRouter();

// 1- we need to make sure that the webhook event is comning from clerk
//2- if so, we will listen for the user.created event
//3- we will save the user to database

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    //check headers
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");
    console.log(svix_id, svix_signature, svix_timestamp);

    if (!svix_id || !svix_signature || !svix_timestamp) {
      console.log("svix header missing");
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    let evt: any;

    //verify the webhook
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-signature": svix_signature,
        "svix-timestamp": svix_timestamp,
      }) as any;
    } catch (error) {
      // console.error("Error verifying webhook");
      return new Response("error occured", { status: 400 });
    }

    const eventType = evt.type;
    // console.log("eventType", eventType);

    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;
      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.user.createUser, {
          email,
          fullname: name,
          image: image_url,
          clerkId: id,
          username: email.split("@")[0],
        });
      } catch (error) {
        console.error("Error creating user", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    return new Response("Webhook processed  and user created sucessfully", {
      status: 200,
    });
  }),
});

export default http;
