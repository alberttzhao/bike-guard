import React, { useState } from 'react';
import './Support.css';

const Support = ({ onBack }) => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    { question: "How do I reset my password?", answer: "You can reset your password from the Account Settings page." },
    { question: "What should I do if my BikeGuard device is lost?", answer: "Report the loss in the BikeGuard app and contact our support team for assistance." },
    { question: "How to mount my BikeGuard to my bike?", answer: "See the user manual to mount your BikeGuard securely." },
  ];

  return (
    <div className="support-page">
      <button className="back-button" onClick={onBack}>
        Back
      </button>

      <div className="support-container">
        <h2 className="support-title">Support</h2>
        <p className="support-text">Need help? Contact us via the options below:</p>
        <ul className="support-list">
          <li>Email: support@bikeguard.com</li>
          <li>Phone: +1 (111) 111-1111</li>
        </ul>
      </div>

      {/* FAQ Section */}
      <div className="faq-container">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <ul className="faq-list">
          {faqs.map((faq, index) => (
            <li key={index} className="faq-item">
              <button className="faq-question" onClick={() => setOpenFAQ(openFAQ === index ? null : index)}>
                {faq.question}
              </button>
              {openFAQ === index && <p className="faq-answer">{faq.answer}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Support;