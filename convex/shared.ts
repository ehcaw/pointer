import { action, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserIdByEmail = action(
  async (_ctx, { userEmail }: { userEmail: string }) => {
    try {
      const res = await fetch(
        `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        console.error(`Clerk API error: ${res.status} - ${res.statusText}`);
        return null;
      }

      const users = await res.json();
      // Clerk returns an array of users matching the email
      return users.length > 0 ? users[0].id : null;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  },
);

export const getCollaboratorsByDocId = query({
  args: { docId: v.string() },
  handler: async (ctx, args) => {
    const documentId = ctx.db.normalizeId("notes", args.docId);
    if (documentId) {
      const documentShares = await ctx.db
        .query("documentShares")
        .filter((q) => q.eq(q.field("documentId"), documentId))
        .collect();

      return documentShares.map((share) => ({
        email: share.userEmail,
        id: share.userId,
      }));
    }
    return [];
  },
});
