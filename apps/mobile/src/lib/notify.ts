import { errorMessage } from "./api";
import { showDialog } from "@/lib/dialog";

export function showError(error: unknown, title = "That did not work") {
  showDialog(title, errorMessage(error));
}
