import Navbar from "../Layout/Navbar";
import { useTheme } from "../../hooks/useTheme";

export default function ArticleShell({ children }) {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <>
      <Navbar activeSection="articles" darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      {children}
    </>
  );
}
