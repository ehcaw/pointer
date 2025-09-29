import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { action } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
});

export const getUserId = action({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity ? identity.subject : null;
  },
});
