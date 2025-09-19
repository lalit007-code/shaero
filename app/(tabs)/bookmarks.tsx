import { Loader } from "@/components/Loader";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function Bookmarks() {
  const bookmarksPost = useQuery(api.bookmark.getAllBookmarkedPost);

  if (bookmarksPost === undefined) return <Loader />;
  if (bookmarksPost.length === 0) return <NoBookmarksFound />;
  return (
    <View style={styles.container}>
      {/* {HEADER} */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
      </View>

      {/* POST */}
      <ScrollView
        contentContainerStyle={{
          padding: 8,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {bookmarksPost.map((post) => {
          return (
            <View key={post?._id} style={{ width: "33.33%", padding: 1 }}>
              <Image
                source={post?.imageUrl}
                style={{ width: "100%", aspectRatio: 1 }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function NoBookmarksFound() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      <Text style={{ color: COLORS.primary, fontSize: 22 }}>
        No Bookmarked Posts Yet
      </Text>
    </View>
  );
}
