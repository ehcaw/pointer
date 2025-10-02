import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

interface UserInfo {
  id: string;
  name?: string;
  color?: string;
  avatar?: string;
}

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // y-partykit passes user info through the connection's partykit info
    // The user info comes from the client when they connect
    return onConnect(conn, this.room, {
      readOnly: false,
      // y-partykit will automatically handle user awareness
      // when the client provides user info
    });
  }

  // Optional: Handle authentication/authorization
  async onRequest(req: Party.Request) {
    // You could add auth middleware here if needed
    return new Response("OK", { status: 200 });
  }
}
