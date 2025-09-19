import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./user";

export const toogleBookmark = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("erro fetching post");

    //if user already bookmarked the post then find it first
    //then remove it
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_post", (q) =>
        q.eq("postId", args.postId).eq("userId", currentUser._id)
      )
      .first();

    if (existing) {
      // removing the bookmark
      await ctx.db.delete(existing._id);
      return false;
    } else {
      // bookmarking the post
      await ctx.db.insert("bookmarks", {
        postId: args.postId,
        userId: currentUser._id,
      });
      return true;
    }
  },
});

export const getAllBookmarkedPost = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const allBookmarkedPost = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .collect();

    const bookmarkWithPostInfo = await Promise.all(
      allBookmarkedPost.map(async (bookmark) => {
        const post = await ctx.db.get(bookmark.postId);

        return post;
      })
    );
    return bookmarkWithPostInfo;
  },
});
