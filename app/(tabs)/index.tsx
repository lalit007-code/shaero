import { Loader } from "@/components/Loader";
import Post from "@/components/Post";
import Story from "@/components/Story";
import { STORIES } from "@/constants/mock-data";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const { signOut } = useAuth();
  const posts = useQuery(api.posts.getFeed);

  //if posts is in loading state, val will be undefined
  if (posts === undefined) return <Loader />;

  return (
    <View style={styles.container}>
      {/* {HEADER} */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>shaero</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons name="log-in-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* {} */}
      <FlatList
        data={posts}
        renderItem={({ item }) => <Post post={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={<StoriesSection />}
      />
    </View>
  );
}

const NoPostFound = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: COLORS.background,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text style={{ fontSize: 20, color: COLORS.primary }}>No Posts Found</Text>
  </View>
);

const StoriesSection = () => {
  return (
    <ScrollView
      horizontal
      showsVerticalScrollIndicator={false}
      style={styles.storiesContainer}
    >
      {/* {STORY} */}
      {STORIES.map((story) => (
        <Story story={story} key={story.id} />
      ))}
    </ScrollView>
  );
};
