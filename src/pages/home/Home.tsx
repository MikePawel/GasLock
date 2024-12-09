import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import "./Home.css";
import Locking from "../locking/Locking";
import Payout from "../payout/Payout";
import { useState } from "react";

type FormType = "locking" | "payout";

export const Home = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const [activeForm, setActiveForm] = useState<FormType>("locking");

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Create Token Lock</h1>
        <div className="connect-section">
          {!isConnected ? (
            <ConnectButton />
          ) : (
            <>
              <div className="wallet-info">
                <p>Address: {address}</p>
                <p>
                  Balance: {balance?.formatted} {balance?.symbol}
                </p>
              </div>
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
              </div>
              {activeForm === "locking" ? (
                <Locking balance={balance} />
              ) : (
                <Payout />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
