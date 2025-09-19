import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Comment from "./Comment";
import { Loader } from "./Loader";

interface CommentsProps {
  postId: Id<"posts">;
  visible: boolean;
  onClose: () => void;
  onCommentsAdded: () => void;
}

export default function CommentsModal({
  postId,
  visible,
  onClose,
  onCommentsAdded,
}: CommentsProps) {
  const [newComment, setNewComment] = useState("");
  const comments = useQuery(api.comments.getComment, { postId });
  const addComment = useMutation(api.comments.addComment);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment({ postId: postId, content: newComment });
      setNewComment("");
      onCommentsAdded();
    } catch (error) {
      console.error("error posting comment", error);
    }
  };

  return (
    <View>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>

          {comments === undefined ? (
            <Loader />
          ) : (
            <FlatList
              data={comments}
              renderItem={({ item }) => <Comment comment={item} />}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.commentsList}
            />
          )}

          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment"
              placeholderTextColor={COLORS.grey}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Text
                style={[
                  styles.postButton,
                  !newComment.trim() && styles.postButtonDisabled,
                ]}
              >
                Post
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
