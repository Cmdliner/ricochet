import { Alert } from "react-native";
import { errorMessage } from "./api";

export function showError(error: unknown, title = "That did not work") {
  Alert.alert(title, errorMessage(error));
}
