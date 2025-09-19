import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./user";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return await ctx.storage.generateUploadUrl();
});

export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image not found");

    //createPost

    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id,
      imageUrl,
      storageId: args.storageId,
      caption: args.caption,
      likes: 0,
      comments: 0,
    });

    //incremnet the post of user by 1

    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });

    return postId;
  },
});

export const getFeed = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    //get all post

    const posts = await ctx.db.query("posts").order("desc").collect();

    if (posts.length === 0) return [];

    //enhance post with userdata and interaction
    const postsWithInfo = await Promise.all(
      posts.map(async (post) => {
        const postAuthor = (await ctx.db.get(post.userId))!;

        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id)
          )
          .first();
        const bookmarks = await ctx.db
          .query("bookmarks")
          .withIndex("by_user_and_post", (q) =>
            q.eq("postId", post._id).eq("userId", currentUser._id)
          )
          .first();

        return {
          ...post,
          author: {
            _id: postAuthor._id,
            username: postAuthor?.username,
            image: postAuthor?.image,
          },
          isLiked: !!like,
          isBookmarked: !!bookmarks,
        };
      })
    );
    return postsWithInfo;
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", args.postId)
      )
      .first();

    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("post not found");

    if (existing) {
      //remove like
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, {
        likes: post.likes - 1,
      });
      return false;
    } else {
      // add like
      const postLiked = await ctx.db.insert("likes", {
        postId: args.postId,
        userId: currentUser._id,
      });
      await ctx.db.patch(args.postId, {
        likes: post.likes + 1,
      });

      if (!postLiked) throw new Error("Error occured during liking post");

      //if it is not my post create a notification
      if (currentUser._id !== post.userId) {
        await ctx.db.insert("notifications", {
          receiverId: post.userId,
          senderId: currentUser._id,
          type: "like",
          postId: args.postId,
        });
      }
      return true;
    }
  },
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("Post not exist");

    if (post?.userId !== currentUser._id) {
      throw new Error("only owner can delete it's own post");
    }
    async function deleteAllByIndex(table, index, postId) {
      const items = await ctx.db
        .query(table)
        .withIndex(index, (q) => q.eq("postId", postId))
        .collect();

      for (const item of items) {
        await ctx.db.delete(item._id);
      }
    }

    //delete all likes,comments and bookmarks
    await deleteAllByIndex("likes", "by_post", post._id);
    await deleteAllByIndex("comments", "by_post", post._id);
    await deleteAllByIndex("bookmarks", "by_post", post._id);

    //delete the photo by storage id
    await ctx.storage.delete(post.storageId);

    //deleting the post
    await ctx.db.delete(args.postId);

    //decrementing the user's post's count by 1
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, (currentUser.posts || 1) - 1),
    });
  },
});
