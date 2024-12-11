import { ConnectButton } from "@rainbow-me/rainbowkit";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="left-section">
          <img
            src="/lock.svg"
            alt="Lock Icon"
            style={{ width: "25px", height: "25px" }}
          />
          <span className="app-name">Gas Lock</span>
        </div>

        <div className="right-section">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
