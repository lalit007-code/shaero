import { styles } from "@/styles/auth.styles";
import { Link } from "expo-router";
import { View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href={"/notifications"}>Feed screen</Link>
    </View>
  );
}
