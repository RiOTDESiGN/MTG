import React, { useState, useEffect } from "react";

export function ScrollButtons() {
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const bottomThreshold = 500;

  const checkScrollPosition = () => {
    const scrolledFromTop = window.scrollY;
    const scrolledToTop = scrolledFromTop <= bottomThreshold;
    const scrolledToBottom =
      window.innerHeight + scrolledFromTop >= document.body.scrollHeight;

    setShowScrollToTop(!scrolledToTop);
    setShowScrollToBottom(
      !scrolledToBottom && scrolledFromTop > bottomThreshold
    );
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScrollPosition);

    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
    };
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {showScrollToTop && (
        <button className="scrollButton scrollToTop" onClick={scrollToTop}>
          ↑
        </button>
      )}
      {showScrollToBottom && (
        <button
          className="scrollButton scrollToBottom"
          onClick={scrollToBottom}
        >
          ↓
        </button>
      )}
    </>
  );
}
