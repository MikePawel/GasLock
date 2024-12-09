import { ConnectButton } from "@rainbow-me/rainbowkit";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="left-section">
          <img src="/logo.svg" alt="Logo" className="logo" />
          <span className="app-name">Gas Lock</span>
        </div>

        <div className="right-section">
          <div className="priority-selector">
            Priority: <span className="priority-value">Fast</span>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
