import React, { useState, useEffect } from "react";

const Card = ({ card, handleRightClick, isModalOpen }) => {
  const [hoveredCard, setHoveredCard] = useState("");
  const [activeCards, setActiveCards] = useState(new Set());
  const [showPriceContainer, setShowPriceContainer] = useState(false);

  const handleCardEvent = (eventType, cardId, event) => {
    event && event.stopPropagation();
    if (isModalOpen) {
      setHoveredCard("");
      return;
    }

    const eventMap = {
      click: () => toggleActiveCard(cardId),
      mouseover: () => setHoveredCard(cardId),
      mouseout: () => setHoveredCard(""),
    };

    eventMap[eventType]?.();
  };

  const handlePriceContainerClick = (event) => {
    event.stopPropagation();
  };

  const toggleActiveCard = (cardId) => {
    setActiveCards((prevActiveCards) => {
      const newActiveCards = new Set(prevActiveCards);
      newActiveCards.has(cardId)
        ? newActiveCards.delete(cardId)
        : newActiveCards.add(cardId);
      return newActiveCards;
    });
  };

  const getCardClass = (card, index) => {
    const classNames = ["displayCard"];
    if (card.id === hoveredCard) {
      classNames.push("hovered");
    }
    const pushIfCondition = (condition, className) =>
      condition && classNames.push(className);
    const layouts = [
      "transform",
      "reversible_card",
      "modal_dfc",
      "art_series",
      "double_faced_token",
    ];
    pushIfCondition(
      layouts.some((layout) => card.layout.includes(layout)),
      index === 1 ? "flip-card-back" : "flip-card-front"
    );
    pushIfCondition(
      card.layout === "transform" && card.type_line.includes("Siege"),
      index === 0 ? "siege" : ""
    );
    if (card.layout === "split") {
      if (card.keywords.includes("Aftermath")) {
        pushIfCondition(true, "aftermath");
      } else {
        pushIfCondition(true, "split");
      }
    }
    return classNames.join(" ");
  };

  const componentLabels = {
    token: "(Token)",
    meld_part: "(Part)",
    meld_result: "(Result)",
  };

  const order = ["meld_part", "token", "meld_result"];

  const renderNormalImage = (card) => (
    <div className={getCardClass(card)}>
      <img src={card.image_uris.normal} alt={card.name} />
    </div>
  );

  const renderUpsidedownImage = (card) => (
    <div className="upsidedown-container">
      <div
        className={`${
          activeCards.has(card.id) ? "upsidedown" : ""
        } ${getCardClass(card)}`}
        onClick={(e) => handleCardEvent("click", card.id, e)}
      >
        <img src={card.image_uris.normal} alt={card.name} />
      </div>
    </div>
  );

  const renderDoubleFaceImage = (card) => (
    <div className="flip-card-container">
      <div
        className={`flip-card ${
          activeCards.has(card.id) ? "flipped" : "flipped-back"
        }`}
        onClick={(e) => handleCardEvent("click", card.id, e)}
      >
        {card.card_faces.map((card_face, index) => (
          <div key={index} className={`${getCardClass(card, index)}`}>
            <img src={card_face.image_uris.normal} alt={card_face.name} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderMeldImage = (card, sortedParts) => (
    <div className={getCardClass(card)}>
      <img src={card.image_uris.normal} alt={card.name} />
      {sortedParts.map((part, index) => (
        <div key={index} className="meldCardTitle">
          <span>{part.name}</span>
          {componentLabels[part.component] || ""}
        </div>
      ))}
    </div>
  );

  const renderImage = (card) => {
    if (card.image_uris && card.layout !== "meld" && card.layout !== "flip") {
      return renderNormalImage(card);
    } else if (card.layout === "flip") {
      return renderUpsidedownImage(card);
    } else if (card.card_faces) {
      return renderDoubleFaceImage(card);
    } else if (card.all_parts && card.layout === "meld") {
      const sortedParts = [...card.all_parts].sort((a, b) => {
        return order.indexOf(a.component) - order.indexOf(b.component);
      });
      return renderMeldImage(card, sortedParts);
    }
    return null;
  };

  useEffect(() => {
    let timer;
    if (hoveredCard) {
      timer = setTimeout(() => setShowPriceContainer(true), 300);
    } else {
      setShowPriceContainer(false);
    }

    return () => clearTimeout(timer);
  }, [hoveredCard]);

  return (
    <>
      <div
        className="imgContainer"
        onMouseEnter={() => handleCardEvent("mouseover", card.id)}
        onMouseLeave={() => handleCardEvent("mouseout", card.id)}
        onClick={(e) => handleCardEvent("click", card.id, e)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleRightClick(card.name);
        }}
      >
        {renderImage(card)}
        {showPriceContainer && (
          <div className="price-container" onClick={handlePriceContainerClick}>
            <span className="dollar-symbol">$</span>
            {!card.prices.eur &&
            !card.prices.usd &&
            !card.prices.eur_foil &&
            !card.prices.usd_foil ? (
              <div className="prices">
                <div className="price">No prices available.</div>
              </div>
            ) : (
              <div className="prices">
                <div className="price">
                  {card.prices.eur && `EUR ${card.prices.eur}€`}
                  {card.prices.eur && card.prices.eur_foil && <br />}
                  {card.prices.eur_foil && `FOIL ${card.prices.eur_foil}€`}
                </div>
                <div className="price">
                  {card.prices.usd && `USD ${card.prices.usd}$`}
                  {card.prices.usd && card.prices.usd_foil && <br />}
                  {card.prices.usd_foil && `FOIL ${card.prices.usd_foil}$`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Card;
