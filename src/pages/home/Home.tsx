import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import "./Home.css";

export const Home = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Create Token Lock</h1>
        <div className="connect-section">
          {!isConnected ? (
            <ConnectButton />
          ) : (
            <div className="wallet-info">
              <p>Address: {address}</p>
              <p>
                Balance: {balance?.formatted} {balance?.symbol}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
