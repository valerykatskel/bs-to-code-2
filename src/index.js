import "./styles.css";
import { code, codeFormatted } from "./modules/elements";
import { transformCode } from "./modules/actions";

(() => {
  code.addEventListener("paste", (event) => {
    let paste = (event.clipboardData || window.clipboardData).getData("text");

    transformCode(paste);
  });
  code.addEventListener("focus", (e) => {
    codeFormatted.value = "";
    code.value = "";
  });
})();
