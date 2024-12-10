import React, { useState, useEffect, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { abi } from "../../assets/abi";
import "./Payout.css";
import { formatTimeUnits } from "../../utils/timeUtils";

interface PayoutFormData {
  amount: string;
  lockDate: string;
  unlockSchedule:
    | "Yearly"
    | "Monthly"
    | "Weekly"
    | "Daily"
    | "Hourly"
    | "No Vesting";
  recipientAddress: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface PayoutProps {
  balance?: {
    formatted: string;
    symbol: string;
  };
}

const SCHEDULE_TO_NUMBER = {
  "No Vesting": 5,
  Hourly: 0,
  Daily: 1,
  Weekly: 2,
  Monthly: 3,
  Yearly: 4,
} as const;

export default function Payout({ balance }: PayoutProps) {
  const [formData, setFormData] = useState<PayoutFormData>({
    amount: "",
    lockDate: new Date().toISOString().slice(0, 16),
    unlockSchedule: "No Vesting",
    recipientAddress: "",
  });

  const [scheduleInfo, setScheduleInfo] = useState({
    unlockDate: "",
    unlockRate: "",
    calculatedAmount: "",
  });

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null
  );

  const datePickerRef = useRef<HTMLInputElement>(null);

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { address, isConnected } = useAccount();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTimeRemaining = () => {
    if (!formData.lockDate) return null;

    const now = new Date().getTime();
    const lockTime = new Date(formData.lockDate).getTime();
    const difference = lockTime - now;

    if (difference <= 0) {
      return null;
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

  const calculateTotalSeconds = (timeRemaining: TimeRemaining) => {
    return (
      timeRemaining.days * 24 * 60 * 60 +
      timeRemaining.hours * 60 * 60 +
      timeRemaining.minutes * 60 +
      timeRemaining.seconds
    );
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (formData.lockDate) {
      const updateCountdown = () => {
        const remaining = calculateTimeRemaining();
        if (remaining) {
          setTimeRemaining(remaining);
        } else {
          clearInterval(timer);
        }
      };

      updateCountdown();
      timer = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [formData.lockDate]);

  const getUnlockRateDisplay = () => {
    if (
      !formData.amount ||
      !formData.unlockSchedule ||
      !formData.lockDate ||
      !timeRemaining
    )
      return "-";

    const amount = parseFloat(formData.amount);
    const totalSeconds = calculateTotalSeconds(timeRemaining);

    switch (formData.unlockSchedule) {
      case "Hourly":
        if (totalSeconds <= 3600) {
          return `${amount.toFixed(2)} GAS/hour`;
        }
        return `${(amount / (totalSeconds / 3600)).toFixed(2)} GAS/hour`;

      case "Daily":
        if (totalSeconds <= 86400) {
          return `${amount.toFixed(2)} GAS/day`;
        }
        return `${(amount / (totalSeconds / 86400)).toFixed(2)} GAS/day`;

      case "Weekly":
        if (totalSeconds / 86400 <= 7) {
          return `${amount.toFixed(2)} GAS/week`;
        }
        return `${(amount / (totalSeconds / 604800)).toFixed(2)} GAS/week`;

      case "Monthly":
        if (totalSeconds / 86400 <= 30) {
          return `${amount.toFixed(2)} GAS/month`;
        }
        return `${(amount / (totalSeconds / 2592000)).toFixed(2)} GAS/month`;

      case "Yearly":
        if (totalSeconds / 86400 <= 365) {
          return `${amount.toFixed(2)} GAS/year`;
        }
        return `${(amount / (totalSeconds / 31536000)).toFixed(2)} GAS/year`;

      default:
        return "-";
    }
  };

  const handleDateButtonClick = () => {
    datePickerRef.current?.showPicker();
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Select Date";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimestampToDate = (timestamp: string) => {
    if (!timestamp) return "-";
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  // Add useEffect for updating scheduleInfo
  useEffect(() => {
    if (formData.amount) {
      const amount = parseFloat(formData.amount);

      setScheduleInfo((prev) => ({
        ...prev,
        calculatedAmount: `${amount.toFixed(2)} GAS`,
      }));

      if (formData.lockDate && formData.unlockSchedule) {
        const unlockTimestamp = Math.floor(
          new Date(formData.lockDate).getTime() / 1000
        );

        setScheduleInfo((prev) => ({
          ...prev,
          unlockDate: unlockTimestamp.toString(),
          unlockRate: getUnlockRateDisplay(),
        }));
      }
    } else {
      setScheduleInfo({
        unlockDate: "",
        unlockRate: "",
        calculatedAmount: "-",
      });
    }
  }, [formData.amount, formData.lockDate, formData.unlockSchedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      console.error("No wallet connected");
      return;
    }

    const unlockTimestamp = Math.floor(
      new Date(formData.lockDate).getTime() / 1000
    );
    const scheduleNumber = SCHEDULE_TO_NUMBER[formData.unlockSchedule];

    try {
      await writeContract({
        address: "0xa071891F15A4c76E3788cd373eB0B17621Eceb41",
        abi,
        functionName: "createLock",
        args: [
          BigInt(unlockTimestamp),
          scheduleNumber,
          formData.recipientAddress, // Use the recipient address from form
        ],
        value: BigInt(parseFloat(formData.amount) * 1e18),
      });
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  return (
    <form className="locking-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="input-header">
          <label htmlFor="amount">Lock Amount</label>
          <span className="balance">
            Balance:{" "}
            {balance?.formatted
              ? `${Number(balance.formatted).toFixed(4)} ${
                  balance.symbol || "GAS"
                }`
              : "0 GAS"}
          </span>
        </div>
        <input
          type="number"
          id="amount"
          name="amount"
          placeholder="Amount in GAS"
          value={formData.amount}
          onChange={handleInputChange}
          required
          min="0"
          step="0.0000000001"
        />
      </div>

      <div className="form-group">
        <div className="input-header">
          <label htmlFor="recipientAddress">Recipient Address</label>
        </div>
        <input
          type="text"
          id="recipientAddress"
          name="recipientAddress"
          placeholder="Enter recipient's wallet address"
          value={formData.recipientAddress}
          onChange={handleInputChange}
          pattern="^0x[a-fA-F0-9]{40}$"
          title="Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)"
          required
        />
      </div>

      <div className="form-group">
        <div className="input-header">
          <label>Lock Until</label>
        </div>
        <button
          type="button"
          className="date-picker-button"
          onClick={handleDateButtonClick}
        >
          <span>{formatDateForDisplay(formData.lockDate)}</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
        <input
          ref={datePickerRef}
          type="datetime-local"
          id="lockDate"
          name="lockDate"
          value={formData.lockDate}
          onChange={handleInputChange}
          className="date-picker-input"
          required
        />
      </div>

      <div className="form-group">
        <div className="input-header">
          <label>Unlock Schedule</label>
        </div>
        <div className="unlock-schedule-buttons">
          <button
            type="button"
            className={`schedule-button ${
              formData.unlockSchedule === "Hourly" ? "active" : ""
            }`}
            onClick={() =>
              handleInputChange({
                target: { name: "unlockSchedule", value: "Hourly" },
              } as any)
            }
          >
            Hourly
          </button>
          <button
            type="button"
            className={`schedule-button ${
              formData.unlockSchedule === "Daily" ? "active" : ""
            }`}
            onClick={() =>
              handleInputChange({
                target: { name: "unlockSchedule", value: "Daily" },
              } as any)
            }
          >
            Daily
          </button>
          <button
            type="button"
            className={`schedule-button ${
              formData.unlockSchedule === "Weekly" ? "active" : ""
            }`}
            onClick={() =>
              handleInputChange({
                target: { name: "unlockSchedule", value: "Weekly" },
              } as any)
            }
          >
            Weekly
          </button>
          <button
            type="button"
            className={`schedule-button ${
              formData.unlockSchedule === "Monthly" ? "active" : ""
            }`}
            onClick={() =>
              handleInputChange({
                target: { name: "unlockSchedule", value: "Monthly" },
              } as any)
            }
          >
            Monthly
          </button>
          <button
            type="button"
            className={`schedule-button ${
              formData.unlockSchedule === "Yearly" ? "active" : ""
            }`}
            onClick={() =>
              handleInputChange({
                target: { name: "unlockSchedule", value: "Yearly" },
              } as any)
            }
          >
            Yearly
          </button>
          <button
            type="button"
            className={`schedule-button ${
              formData.unlockSchedule === "No Vesting" ? "active" : ""
            }`}
            onClick={() =>
              handleInputChange({
                target: { name: "unlockSchedule", value: "No Vesting" },
              } as any)
            }
          >
            No Vesting
          </button>
        </div>
      </div>
      <div className="form-group">
        <div className="input-header">
          <label>Who can cancel the contract?</label>
        </div>
        <div className="cancel-authority">
          <span>No one can cancel this contract</span>
        </div>
      </div>

      <div className="schedule-info">
        <p>
          <span>Lock Date:</span>
          <span>{new Date().toLocaleString()}</span>
        </p>
        <p>
          <span>Unlock Date:</span>
          <span>
            {new Date(
              parseInt(scheduleInfo.unlockDate) * 1000
            ).toLocaleString()}
          </span>
        </p>
        <p>
          <span>Unlock Rate:</span>
          <span>{getUnlockRateDisplay()}</span>
        </p>
        <p>
          <span>Total Lock Amount:</span>
          <span>{scheduleInfo.calculatedAmount || "-"}</span>
        </p>
        <p>
          <span>Recipient:</span>
          <span>
            {formData.recipientAddress || "Please enter recipient address"}
          </span>
        </p>
        <p>
          <span>Cancel Authority:</span>
          <span>None</span>
        </p>
      </div>

      {!hash && (
        <button
          type="submit"
          className="submit-button"
          disabled={
            isPending ||
            !isConnected ||
            !formData.recipientAddress ||
            !formData.amount ||
            !formData.lockDate
          }
        >
          {isPending ? "Creating Lock..." : "Create Lock"}
        </button>
      )}

      {(hash || isConfirming || isConfirmed) && (
        <div className="transaction-status">
          <div className="transaction-steps">
            <div className={`step ${hash ? "active completed" : ""}`}>
              <div className="step-indicator">1</div>
              <div className="step-content">
                <h4>Transaction Submitted</h4>
                {hash && (
                  <div className="transaction-hash">
                    <span>Hash: </span>
                    <a
                      href={`https://xexplorer.neo.org/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {hash.slice(0, 6)}...{hash.slice(-4)}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`step ${isConfirming ? "active" : ""} ${
                isConfirmed ? "completed" : ""
              }`}
            >
              <div className="step-indicator">2</div>
              <div className="step-content">
                <h4>Confirming Transaction</h4>
                {isConfirming && (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Waiting for confirmation...</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`step ${isConfirmed ? "active completed" : ""}`}>
              <div className="step-indicator">3</div>
              <div className="step-content">
                <h4>Lock Created</h4>
                {isConfirmed && receipt?.logs[0]?.topics[1] && (
                  <div className="lock-details">
                    <code className="lock-id">
                      {receipt.logs[0].topics[1]}
                      <button
                        type="button"
                        className="copy-button-minimal"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (receipt.logs[0]?.topics[1]) {
                            navigator.clipboard.writeText(
                              receipt.logs[0].topics[1]
                            );
                          }
                        }}
                        title="Copy Lock ID"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
