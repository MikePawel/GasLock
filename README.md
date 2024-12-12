# Grind Hackathon Submission for NEO X

## Project Name: **GasLock**

---

## Official Website

[Visit Official Website Here](https://gaslock.netlify.app/)

## Demo Video

[Watch Demo Video Here](demoVideo)

---

## Description

GasLock is a decentralized application deployed on the NEO X Blockchain. It allows users to lock and vest GAS tokens with smart contract security and transparency. The key functionalities include:

### 1\. **GAS Locking**

- Users can deposit any amount of GAS into the smart contract and lock it for a predefined period.
- The locked funds cannot be redeemed earlier or manipulated by anyone, ensuring absolute security.
- Designed for users who wish to enforce "forced diamond hands," e.g., locking GAS for a year to achieve tax-free status in countries like Germany.

### 2\. **Vesting Schedule Creation**

- Users can create a vesting schedule to distribute a specified amount of GAS tokens to a recipient over time.
- Vesting options include hourly, daily, weekly, monthly, or yearly intervals, ending at the specified deadline.
- Ideal for scenarios such as payroll management, contract-based payments, or structured disbursement of funds.

---

## Key Features

- **Immutable and Transparent:** The smart contract is verified and deployed on the NEO X Blockchain, making the logic visible to anyone, enhancing trust.
- **Traceable Transactions:** Upon successful transactions, users receive a transaction hash and a unique lock ID for tracking.
- **Data Transparency:** The lock ID stores all the necessary data about the transaction and can be viewed publicly under the "Read Lock" tab.

---

## How It Works

1.  **Deposit GAS:**
    - Users deposit GAS into the smart contract and specify the lock duration or vesting schedule under the "Locking" or "Payout" tab.
2.  **Transaction Hash & Receipt:**
    - Users receive a transaction hash to trace the transaction and a receipt containing a unique lock ID.
3.  **Read Lock Data:**
    - The lock ID can be used to view all transaction specifications under the "Read Lock" tab.

---

## Potential Use Cases

### GAS Locking:

- **Forced Diamond Hands:**
  - Individuals can use GasLock to enforce "forced diamond hands," locking their GAS tokens for a specific period. For example, locking tokens for a year to benefit from tax advantages in certain jurisdictions (e.g., Germany).
- **Building Trust in Communities:**
  - Community organizers or project teams can lock their tokens for a specified period, making the lock visible to everyone. This demonstrates their commitment and builds trust within their community.

### Vesting Schedule:

- **Transparent Employee Payments:**
  - Employers can use GasLock to set up a transparent and structured vesting schedule for distributing payroll to employees. Payments are made at regular intervals, ensuring fairness and transparency.
- **Self-Control Mechanisms:**
  - Individuals can use GasLock to manage their finances responsibly. For example, after a lottery win or receiving a large sum, they can lock tokens for 10, 20, or 30 years and vest them monthly to avoid spending all the money at once.
- **Controlled Fund Distribution:**
  - GasLock can also be used for distributing funds in contracts or grants over time, ensuring recipients receive payments in a controlled and predictable manner.

---

## How to Deploy Locally

To deploy GasLock locally, follow these steps:

**Clone the repository:**

```
git clone https://github.com/MikePawel/GasLock
```

**Navigate to the project directory:**

```
cd <repository-directory>
```

**Install dependencies:**

```
npm install
```

**Run the development server:**

```
npm run dev
```

---

## Security and Transparency

GasLock leverages the NEO X Blockchain's robust infrastructure to ensure that funds are secure, and the contract logic is immutable and auditable. This level of transparency fosters trust among users and stakeholders.
