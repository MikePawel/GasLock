import React, { useState, useEffect, useRef } from "react";
import "./Locking.css";

interface LockingFormData {
  lockTitle: string;
  amount: string;
  lockDate: string;
  unlockSchedule: "Yearly" | "Monthly" | "Weekly" | "Daily" | "Hourly";
  cancelAuthority: "None" | "Owner" | "Both";
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface LockingProps {
  balance?: {
    formatted: string;
    symbol: string;
  };
}

export default function Locking({ balance }: LockingProps) {
  const [formData, setFormData] = useState<LockingFormData>({
    lockTitle: "",
    amount: "",
    lockDate: new Date().toISOString().slice(0, 16),
    unlockSchedule: "Yearly",
    cancelAuthority: "None",
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateDaysUntilUnlock = (unlockSchedule: string): number => {
    switch (unlockSchedule) {
      case "Hourly":
        return 1 / 24; // fraction of a day
      case "Daily":
        return 1;
      case "Weekly":
        return 7;
      case "Monthly":
        return 30;
      case "Yearly":
        return 365;
      default:
        return 0;
    }
  };

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

  useEffect(() => {
    if (formData.amount) {
      const amount = parseFloat(formData.amount);

      setScheduleInfo((prev) => ({
        ...prev,
        calculatedAmount: `${amount.toFixed(2)} GAS`,
      }));

      if (formData.lockDate && formData.unlockSchedule) {
        // Current timestamp for lock date
        const lockTimestamp = Math.floor(Date.now() / 1000);

        // Selected date for unlock date
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Current timestamp for lock date
    const lockTimestamp = Math.floor(Date.now() / 1000);

    // Selected date for unlock date
    const unlockTimestamp = Math.floor(
      new Date(formData.lockDate).getTime() / 1000
    );

    // Calculate unlock rate based on schedule and amount
    const calculateUnlockRate = () => {
      if (!formData.amount || !timeRemaining) return "0";

      const amount = parseFloat(formData.amount);
      const totalSeconds = unlockTimestamp - lockTimestamp;

      switch (formData.unlockSchedule) {
        case "Hourly":
          return (amount / (totalSeconds / 3600)).toString();
        case "Daily":
          return (amount / (totalSeconds / 86400)).toString();
        case "Weekly":
          return (amount / (totalSeconds / 604800)).toString();
        case "Monthly":
          return (amount / (totalSeconds / 2592000)).toString();
        case "Yearly":
          return (amount / (totalSeconds / 31536000)).toString();
        default:
          return "0";
      }
    };

    const lockData = {
      title: formData.lockTitle,
      amount: formData.amount,
      lockTimestamp,
      unlockTimestamp,
      unlockRate: calculateUnlockRate(),
      unlockSchedule: formData.unlockSchedule,
      cancelAuthority: formData.cancelAuthority,
    };

    console.log("Lock created:", lockData);
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

      updateCountdown(); // Initial call
      timer = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [formData.lockDate]);

  // Add this helper function to calculate total seconds
  const calculateTotalSeconds = (timeRemaining: TimeRemaining) => {
    return (
      timeRemaining.days * 24 * 60 * 60 +
      timeRemaining.hours * 60 * 60 +
      timeRemaining.minutes * 60 +
      timeRemaining.seconds
    );
  };

  // Add this helper function to convert seconds to different time units
  const formatTimeUnits = (totalSeconds: number) => {
    const minutes = totalSeconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const weeks = days / 7;
    const months = days / 30;
    const years = days / 365;

    return {
      minutes: minutes.toFixed(2),
      hours: hours.toFixed(2),
      days: days.toFixed(2),
      weeks: weeks.toFixed(2),
      months: months.toFixed(2),
      years: years.toFixed(2),
    };
  };

  // Add this helper function to convert timestamp to date string
  const formatTimestampToDate = (timestamp: string) => {
    if (!timestamp) return "-";
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  return (
    <form className="locking-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="input-header">
          <label htmlFor="lockTitle">Lock Title</label>
        </div>
        <input
          type="text"
          id="lockTitle"
          name="lockTitle"
          placeholder="eg: Team Tokens"
          value={formData.lockTitle}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <div className="input-header">
          <label htmlFor="amount">Lock Amount</label>
          <span className="balance">
            Balance: {balance?.formatted || "0"} {balance?.symbol || "GAS"}
          </span>
        </div>
        <input
          type="number"
          id="amount"
          name="amount"
          placeholder="Amount in GAS"
          value={formData.amount}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <div className="input-header">
          <label htmlFor="lockDate">Lock Date</label>
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
        />
      </div>

      <div className="form-group">
        <div className="input-header">
          <label htmlFor="unlockSchedule">Unlock Schedule</label>
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
        </div>
      </div>

      <div className="form-group">
        <div className="input-header">
          <label htmlFor="cancelAuthority">Who can cancel the contract?</label>
        </div>
        <select
          id="cancelAuthority"
          name="cancelAuthority"
          value={formData.cancelAuthority}
          onChange={handleInputChange}
          className="full-width-select"
        >
          <option value="None">None</option>
          <option value="Owner">Owner</option>
        </select>
      </div>

      <div className="schedule-info">
        <p>
          <span>Lock Title:</span>
          <span>{formData.lockTitle || "-"}</span>
        </p>
        <p>
          <span>Lock Date:</span>
          <span>{new Date().toLocaleDateString()}</span>
        </p>
        <p>
          <span>Unlock Date:</span>
          <span>{formatTimestampToDate(scheduleInfo.unlockDate)}</span>
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
          <span>Cancel Authority:</span>
          <span>{formData.cancelAuthority}</span>
        </p>
      </div>

      <div className="countdown-section">
        {formData.lockDate && timeRemaining && (
          <>
            <div className="countdown-display">
              <span>{timeRemaining.days}d </span>
              <span>{timeRemaining.hours}h </span>
              <span>{timeRemaining.minutes}m </span>
              <span>{timeRemaining.seconds}s</span>
            </div>
            <div className="total-seconds">
              {calculateTotalSeconds(timeRemaining).toLocaleString()} seconds
            </div>
            <div className="time-conversion">
              {Object.entries(
                formatTimeUnits(calculateTotalSeconds(timeRemaining))
              ).map(([unit, value]) => (
                <div key={unit} className="conversion-row">
                  <span className="unit">{unit}:</span>
                  <span className="value">{value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button type="submit" className="submit-button">
        Create Lock
      </button>
    </form>
  );
}
