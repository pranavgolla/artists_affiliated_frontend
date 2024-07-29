import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import config from "./config";
import "./TransactionTable.css";

Modal.setAppElement("#root");

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0], // Set default date to today
    description: "",
    type: "credit",
    amount: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (!newTransaction.description || newTransaction.amount <= 0) {
      alert("Please fill in all required fields and enter a valid amount.");
      setIsSubmitting(false);
      return;
    }

    const newAmount = parseFloat(newTransaction.amount);
    const lastTotal = transactions.length
      ? transactions[transactions.length - 1].total
      : 0;

    if (newTransaction.type === "debit" && newAmount > lastTotal) {
      alert("Insufficient funds");
      setIsSubmitting(false);
      return;
    }

    const newTotal =
      newTransaction.type === "credit"
        ? lastTotal + newAmount
        : lastTotal - newAmount;

    const newEntry = {
      date: newTransaction.date,
      description: newTransaction.description,
      credit: newTransaction.type === "credit" ? newAmount : 0,
      debit: newTransaction.type === "debit" ? newAmount : 0,
      total: newTotal,
    };
    console.log("New Entry:", newEntry);

    try {
      const response = await axios.post(
        `${config.API_URL}/transactions/`,
        newEntry
      );
      console.log(response);
      setModalIsOpen(false);
      setNewTransaction({
        date: new Date().toISOString().split("T")[0], // Reset date to today
        description: "",
        type: "credit",
        amount: 0,
      });
      fetchTransactions(); // Fetch the updated transactions list
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevents default form submission if handling it manually
      handleSubmit();
    }
  };

  return (
    <div className="transaction-table-container">
      <div className="header-container">
        <h1>Transaction Table</h1>
        <button onClick={() => setModalIsOpen(true)}>+  Add Transaction</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Office Transaction (Date)</th>
            <th>Description</th>
            <th>Credit</th>
            <th>Debit</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction._id}>
              <td>{transaction.date}</td>
              <td>{transaction.description}</td>
              <td>{transaction.credit}</td>
              <td>{transaction.debit}</td>
              <td>{transaction.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="modal"
      >
        <button onClick={() => setModalIsOpen(false)} className="modal-close">
          X
        </button>
        <h2>Add Transaction</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <label>
            Date: <span className="required">*</span>
            <input
              type="text"
              name="date"
              value={newTransaction.date}
              readOnly
            />
          </label>
          <label>
            Type:
            <select
              name="type"
              value={newTransaction.type}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            >
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </label>
          <label>
            Description <span className="required">*</span>:
            <input
              type="text"
              name="description"
              value={newTransaction.description}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              required
            />
          </label>
          <label>
            Amount <span className="required">*</span>:
            <input
              type="number"
              name="amount"
              value={newTransaction.amount}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              min="0"
              step="0.01"
              required
            />
          </label>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TransactionTable;
