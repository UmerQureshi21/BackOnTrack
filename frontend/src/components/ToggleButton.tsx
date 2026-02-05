import { useEffect, useState } from "react";

function ToggleButton() {
  const [theme, setTheme] = useState("light");

  const handleThemeSwitch = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      document.documentElement.dataset.theme = "light";
    }
  }, [theme]);

  return (
    <button
      onClick={handleThemeSwitch}
      className="bg-blue-900 text-black p-2 rounded-md mb-4 hover:cursor-pointer transition-all duration-300"
    >
      Toggle Theme
    </button>
  );
}

export default ToggleButton;
