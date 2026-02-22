import "assets/css/team.css";
import { EventIterationType } from "api/types/EventIterationType.ts";
import React, { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FAQCard({
  iteration,
}: {
  iteration: EventIterationType;
}) {
  console.log(iteration.faq);
  return (
    <div className="card no-scroll expand">
      <h1 className="card__title">FAQ</h1>
      {iteration.faq.map((item, i) => (
        <FAQItem key={i} question={item.q} answer={item.a} />
      ))}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [showAnswer, setShowAnswer] = useState(false);

  const DropdownArrow = showAnswer ? IoIosArrowUp : IoIosArrowDown;

  return (
    <div>
      <div
        className="card__row spaced clickable"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <p className="card--teams__subtitle">{question}</p>
        <DropdownArrow size={32} style={{ flexShrink: 0 }} />
      </div>
      {showAnswer && (
        <p className="info-text">
          <Markdown remarkPlugins={[remarkGfm]}>{answer}</Markdown>
        </p>
      )}
    </div>
  );
}
