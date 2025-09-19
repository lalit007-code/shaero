import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./user";

export const addComment = mutation({
  args: { postId: v.id("posts"), content: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("post not found");

    const commentId = await ctx.db.insert("comments", {
      content: args.content,
      postId: args.postId,
      userId: currentUser._id,
    });

    if (!commentId) throw new Error("comment added error");
    await ctx.db.patch(args.postId, {
      comments: post.comments + 1,
    });

    //create a notification if it is not my post
    if (post.userId !== currentUser._id) {
      await ctx.db.insert("notifications", {
        senderId: currentUser._id,
        receiverId: post.userId,
        type: "comments",
        commentId,
        postId: args.postId,
      });
    }

    return commentId;
  },
});

export const getComment = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const commentsWithInfo = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: {
            fullname: user?.fullname,
            image: user?.image,
          },
        };
      })
    );
    return commentsWithInfo;
  },
});
