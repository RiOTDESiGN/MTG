import React, { useState } from "react";

const Card = ({ card, handleRightClick, isModalOpen }) => {

  const [hoveredCard, setHoveredCard] = useState("");
  const [activeCards, setActiveCards] = useState(new Set());

  const handleCardEvent = (eventType, cardId, event) => {
    event && event.stopPropagation();
    if (isModalOpen) return;
    
    const eventMap = {
      'click': () => toggleActiveCard(cardId),
      'mouseover': () => setHoveredCard(cardId),
      'mouseout': () => setHoveredCard("")
    };
    
    eventMap[eventType]?.();
  };

  const toggleActiveCard = (cardId) => {
    setActiveCards((prevActiveCards) => {
      const newActiveCards = new Set(prevActiveCards);
      newActiveCards.has(cardId) ? newActiveCards.delete(cardId) : newActiveCards.add(cardId);
      return newActiveCards;
    });
  };  
  
  const getCardClass = (card, index) => {
    const classNames = ["displayCard"];
    if (card.id === hoveredCard) {classNames.push("hovered");}
    const pushIfCondition = (condition, className) => condition && classNames.push(className);
    const layouts = ["transform", "reversible_card", "modal_dfc", "art_series", "double_faced_token"];
      pushIfCondition	(layouts.some((layout) => card.layout.includes(layout)), index === 1 ? "flip-card-back" : "flip-card-front");		
      pushIfCondition	(card.layout === "transform" && card.type_line.includes("Siege"), index === 0 ? "siege" : "");
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
    token: '(Token)',
    meld_part: '(Part)',
    meld_result: '(Result)'
  };
  
  const order = ['meld_part', 'token', 'meld_result'];
  
  const renderNormalImage = (card) => (
    <div className={getCardClass(card)}>
      <img src={card.image_uris.normal} alt={card.name} />
    </div>
  );

  const renderFlipImage = (card) => (
    <div className="upsidedown-container">
      <div className={`${activeCards.has(card.id) ? 'upsidedown' : ''}`} onClick={(e) => handleCardEvent('click', card.id, e)}>
        <div className={getCardClass(card)}>
          <img src={card.image_uris.normal} alt={card.name} />
        </div>
      </div>
    </div>
  );

  const renderDoubleFaceImage = (card) => (
    <div className="flip-card-container">
      <div className={`flip-card ${activeCards.has(card.id) ? 'flipped' : 'flipped-back'}`} onClick={(e) => handleCardEvent('click', card.id, e)}>
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
          {componentLabels[part.component] || ''}
        </div>
      ))}
    </div>
  );
  
  const renderImage = (card) => {
    if (card.image_uris && card.layout !== "meld" && card.layout !== "flip") {
      return renderNormalImage(card);
    } else if (card.layout === "flip") {
      return renderFlipImage(card);
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

  return (
    <>
      <div className="imgContainer"
        onMouseOver={() => handleCardEvent('mouseover', card.id)}
        onMouseOut={() => handleCardEvent('mouseout', card.id)}
        onClick={(e) => handleCardEvent('click', card.id, e)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleRightClick(card.name);
        }}
      >
        {renderImage(card)}
      </div>
    </>
  );
};

export default Card;