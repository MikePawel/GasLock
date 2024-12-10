import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { abi } from "../../assets/abi";
import { useState, useEffect } from "react";
import "./ReadLock.css";
import { formatTimeUnits } from "../../utils/timeUtils";

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const SCHEDULE_MAP = {
  0: "Hourly",
  1: "Daily",
  2: "Weekly",
  3: "Monthly",
  4: "Yearly",
  5: "No Vesting",
} as const;

export default function ReadLock() {
  const [lockId, setLockId] = useState("");
  const [lockInfo, setLockInfo] = useState<any>(null);
  const [withdrawableAmount, setWithdrawableAmount] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null
  );
  const [addressMatch, setAddressMatch] = useState<string>("");
  const { address } = useAccount();
  const [invalidLockId, setInvalidLockId] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: lockInfoData, refetch } = useReadContract({
    abi,
    address: "0xa071891F15A4c76E3788cd373eB0B17621Eceb41",
    functionName: "getLockInfo",
    args: lockId ? [lockId] : undefined,
  });

  const { data: withdrawableData } = useReadContract({
    abi,
    address: "0xa071891F15A4c76E3788cd373eB0B17621Eceb41",
    functionName: "calculateWithdrawableAmount",
    args: lockId ? [lockId] : undefined,
  });

  useEffect(() => {
    if (withdrawableData) {
      setWithdrawableAmount(withdrawableData);
    }
  }, [withdrawableData]);

  const handleGetInfo = async () => {
    if (!lockId) return;

    setLoading(true);
    const result = await refetch();
    const data = result.data as [
      string,
      string,
      bigint,
      bigint,
      bigint,
      number,
      bigint
    ];
    setLockInfo(data);

    if (!data || data[0] === "") {
      setInvalidLockId(true);
    } else {
      setInvalidLockId(false);
    }
    setLoading(false);
  };

  const { data: hash, isPending, writeContract } = useWriteContract();

  const handleWithdraw = async (lockId: string) => {
    try {
      await writeContract({
        address: "0xa071891F15A4c76E3788cd373eB0B17621Eceb41",
        abi,
        functionName: "withdraw",
        args: [lockId],
      });
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const calculateTimeRemaining = (unlockTimestamp: number) => {
    const now = Date.now();
    const unlockTime = unlockTimestamp * 1000;
    const difference = unlockTime - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      ),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (lockInfo) {
      const unlockTimestamp = Number(lockInfo[4]);
      const updateCountdown = () => {
        const remaining = calculateTimeRemaining(unlockTimestamp);
        setTimeRemaining(remaining);

        if (
          remaining.days === 0 &&
          remaining.hours === 0 &&
          remaining.minutes === 0 &&
          remaining.seconds === 0
        ) {
          const recipientAddress = lockInfo[1];
          if (recipientAddress.toLowerCase() === address?.toLowerCase()) {
            setAddressMatch("Correct address");
          } else {
            setAddressMatch("Wrong address");
          }
        }
      };

      updateCountdown();
      timer = setInterval(updateCountdown, 1000);

      return () => clearInterval(timer);
    }
  }, [lockInfo, address]);

  const calculateTotalSeconds = (timeRemaining: TimeRemaining) => {
    return (
      timeRemaining.days * 24 * 60 * 60 +
      timeRemaining.hours * 60 * 60 +
      timeRemaining.minutes * 60 +
      timeRemaining.seconds
    );
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatGasAmount = (weiAmount: bigint) => {
    return (Number(weiAmount) / 1e18).toFixed(4) + " GAS";
  };

  return (
    <div className="read-lock-container">
      <div className="input-section">
        <input
          type="text"
          value={lockId}
          onChange={(e) => setLockId(e.target.value)}
          placeholder="Enter Lock ID"
          className="lock-id-input"
        />
        <button onClick={handleGetInfo} disabled={!lockId}>
          Get Lock Details
        </button>
      </div>

      {loading && (
        <div
          className="loading-spinner"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      {lockInfo && (
        <div className="lock-info">
          {timeRemaining && (
            <div className="countdown-section">
              <div className="total-seconds">
                Time until lockup period is over
              </div>
              <div className="countdown-display">
                <span>{timeRemaining.days}d</span>
                <span>{timeRemaining.hours}h</span>
                <span>{timeRemaining.minutes}m</span>
                <span>{timeRemaining.seconds}s</span>
              </div>

              {/* <div className="time-conversion">
                {Object.entries(
                  formatTimeUnits(calculateTotalSeconds(timeRemaining))
                ).map(([unit, value]) => (
                  <div key={unit} className="conversion-row">
                    <span className="unit">{unit}:</span>
                    <span className="value">{value}</span>
                  </div>
                ))}
              </div> */}
              <div style={{ paddingBottom: "40px" }}></div>
            </div>
          )}

          <p>
            <span>Recipient:</span>
            <span>{lockInfo[1]}</span>
          </p>
          <p>
            <span>Total Amount locked:</span>
            <span>{formatGasAmount(lockInfo[2])}</span>
          </p>
          <p>
            <span>Lock Date:</span>
            <span>{formatTimestamp(lockInfo[3])}</span>
          </p>
          <p>
            <span>Unlock Date:</span>
            <span>{formatTimestamp(lockInfo[4])}</span>
          </p>
          <p>
            <span>Vesting Rate:</span>
            <span>
              {SCHEDULE_MAP[lockInfo[5] as keyof typeof SCHEDULE_MAP]}
            </span>
          </p>
          <p>
            <span>Remaining Amount:</span>
            <span>{formatGasAmount(lockInfo[6])}</span>
          </p>
          <p>
            <span>Withdrawable Amount:</span>
            <span>
              {withdrawableAmount
                ? formatGasAmount(withdrawableAmount)
                : "0 GAS"}
            </span>
          </p>
        </div>
      )}

      {/* {timeRemaining &&
        timeRemaining.days === 0 &&
        timeRemaining.hours === 0 &&
        timeRemaining.minutes === 0 &&
        timeRemaining.seconds === 0 && (
          <div className="address-check">
            <div className="address-check-content">
              {addressMatch === "Correct address" && (
                <>
                  <p style={{ paddingBottom: "20px" }}>
                    Withdrawable Amount: {formatGasAmount(withdrawableAmount)}
                  </p>
                  <button
                    className="withdraw-button"
                    onClick={() => handleWithdraw(lockId)}
                  >
                    Withdraw
                  </button>
                </>
              )}
            </div>
          </div>
        )} */}
      {withdrawableAmount && (
        <button
          className="withdraw-button"
          onClick={() => handleWithdraw(lockId)}
        >
          Withdraw
        </button>
      )}

      {invalidLockId && (
        <div className="invalid-lock-id">
          <p>This lock ID is invalid.</p>
        </div>
      )}
    </div>
  );
}
