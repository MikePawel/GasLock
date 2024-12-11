import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import "./Home.css";
import Locking from "../locking/Locking";
import Payout from "../payout/Payout";
import ReadLock from "../readLock/ReadLock";
import { useState, useEffect } from "react";

type FormType = "locking" | "payout" | "readLock";

export const Home = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const [activeForm, setActiveForm] = useState<FormType>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const activeParam = urlParams.get("active") as FormType;
    return activeParam || "locking"; // Default to "locking" if no parameter
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const activeParam = urlParams.get("active") as FormType;
    if (activeParam) {
      setActiveForm(activeParam);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("active", activeForm);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams}`
    );
  }, [activeForm]);

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">
          {activeForm === "locking"
            ? "Create Token Lock"
            : activeForm === "payout"
            ? "Create Payout Vesting"
            : "Get Lock ID Information"}
        </h1>
        <div className="connect-section">
          <div className="form-toggle">
            <button
              className={`toggle-button ${
                activeForm === "locking" ? "active" : ""
              }`}
              onClick={() => setActiveForm("locking")}
            >
              Locking
            </button>
            <button
              className={`toggle-button ${
                activeForm === "payout" ? "active" : ""
              }`}
              onClick={() => setActiveForm("payout")}
            >
              Payout
            </button>
            <button
              className={`toggle-button ${
                activeForm === "readLock" ? "active" : ""
              }`}
              onClick={() => setActiveForm("readLock")}
            >
              Read Lock
            </button>
          </div>
          {!isConnected ? (
            <>
              {activeForm === "readLock" ? (
                <ReadLock />
              ) : (
                <>
                  <ConnectButton />
                </>
              )}
            </>
          ) : (
            <>
              {activeForm === "locking" ? (
                <Locking balance={balance} />
              ) : activeForm === "payout" ? (
                <Payout balance={balance} />
              ) : (
                <ReadLock />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
