import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/feed.styles";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Image } from "expo-image";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import CommentsModal from "./CommentsModal";

type PostProps = {
  author: {
    _id: string;
    username: string | undefined;
    image: string | undefined;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  _id: Id<"posts">;
  _creationTime: number;
  caption?: string | undefined;
  userId: string;
  imageUrl: string;
  storageId: string;
  likes: number;
  comments: number;
};

export default function Post({ post }: { post: PostProps }) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);

  const { user } = useUser();

  const deletePost = useMutation(api.posts.deletePost);
  const toggleBookmark = useMutation(api.bookmark.toogleBookmark);
  const toggleLike = useMutation(api.posts.toggleLike);
  const cureentUser = useQuery(
    api.user.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const handleToggleBookmark = async () => {
    try {
      const bookmarkResponse = await toggleBookmark({ postId: post._id });
      setIsBookmarked(bookmarkResponse);
    } catch (error) {
      console.error("error toggling bookmark", error);
    }
  };
  const handleLike = async () => {
    try {
      const likedResponse = await toggleLike({ postId: post._id });
      setIsLiked(likedResponse);
      setLikesCount((prev) => (likedResponse ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost({ postId: post._id });
    } catch (error) {
      console.log("Error deleting post:", error);
    }
  };
  return (
    <View style={styles.post}>
      {/* {POST HEADER} */}
      <View style={styles.postHeader}>
        <Link href={"/(tabs)/profile"}>
          <TouchableOpacity style={styles.postHeaderLeft}>
            <Image
              source={post.author.image}
              style={styles.postAvatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
          <Text style={styles.postUsername}>{post.author.username}</Text>
        </Link>

        {/* {SHOW A DELETE BUTTON} : TODO*/}

        {post.author._id === cureentUser?._id ? (
          <TouchableOpacity onPress={() => handleDelete()}>
            <Ionicons name="trash-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={COLORS.white}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* {POST} */}
      <Image
        source={post.imageUrl}
        style={styles.postImage}
        contentFit="cover"
        transition={200}
        cachePolicy={"memory-disk"}
      />

      {/* {POST ACTION} */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              onPress={handleLike}
              size={24}
              color={isLiked ? Colors.primary : COLORS.white}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCommentsModal(true)}>
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleToggleBookmark}>
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* {POST INFO} */}
      <View style={styles.postInfo}>
        <Text style={styles.likesText}>
          {likesCount > 0
            ? `${likesCount.toLocaleString()}`
            : "Be first to like this post"}
        </Text>
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>{post.author.username}</Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        )}

        {commentsCount > 0 && (
          <TouchableOpacity onPress={() => setShowCommentsModal(true)}>
            <Text style={styles.commentsText}>
              view all {commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgo}>
          {formatDistanceToNow(post._creationTime, { addSuffix: true })}
        </Text>
      </View>

      <CommentsModal
        postId={post._id}
        visible={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        onCommentsAdded={() => setCommentsCount((prev) => prev + 1)}
      />
    </View>
  );
}
