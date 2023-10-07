import React, { useState } from "react";
import axios from "axios";

function CardsDisplay() {
  const [query, 				setQuery] 				= useState("");
	const [errorMessage, 	setErrorMessage] 	= useState('');
  const [cards, 				setCards] 				= useState([]);
	const [totalCards, 		setTotalCards] 		= useState(0);
	const [selectedSort, 	setSelectedSort] 	= useState("");
	const [hoveredCard, 	setHoveredCard] 	= useState("");
	const [activeCards, 	setActiveCards] 	= useState([]);
	const [currentPage, 	setCurrentPage] 	= useState(1);
	const [nextPageUrl, 	setNextPageUrl] 	= useState("");
	const [isLoading, 		setIsLoading] 		= useState(false);

	const newSearch = () => {
		setSelectedSort("");
	};

	const searchCards = async () => {
		console.log('Communicating with API.');
	
		setCards([]);
		setNextPageUrl("");
		newSearch("");
		setTotalCards("0");
		
		try {
			let apiUrl = nextPageUrl ? nextPageUrl : `https://api.scryfall.com/cards/search?q=${query}`;
			const response = await axios.get(apiUrl);
	
			setCards(response.data.data);
			setTotalCards(response.data.total_cards);
			
			if (response.data.has_more) {
				setNextPageUrl(response.data.next_page);
			}
		} catch (error) {
			const errorMessage = error.response && error.response.status === 404
				? "No cards found. Your search didn’t match any cards, please try again."
				: "An error occurred";
			
			setErrorMessage(errorMessage);
		}
	};	

	const cardsPerPage = 175;
	const totalPages = Math.ceil(totalCards / cardsPerPage);
	const pageButtons = Array.from({ length: totalPages }, (_, i) => i + 1);

	const goToPage = async (page) => {
		setCurrentPage(page);
		await searchCards();
	};	

	const nextPage = async () => {
		setIsLoading(true);
		setCurrentPage(prevPage => prevPage + 1);
		await searchCards();
		setIsLoading(false);
	};
	
	const prevPage = async () => {
		setIsLoading(true);
		setCurrentPage(prevPage => prevPage - 1);
		await searchCards();
		setIsLoading(false);
	};

const compareByLocale = (val1, val2) => val1.localeCompare(val2);

const getComparator = (criteria) => {
  if (criteria === 'color_identity') {
    return (a, b) => {
      const aColors = a.color_identity.join('');
      const bColors = b.color_identity.join('');
      return compareByLocale(aColors, bColors);
    };
  }
  return (a, b) => compareByLocale(a[criteria], b[criteria]);
};

const sortCards = (criteria) => {
  const comparator = getComparator(criteria);
  const sortedCards = [...cards].sort(comparator);
  setCards(sortedCards);
};

const handleCardEvent = (event, cardId) => {
  const eventType = event.type;

  if (eventType === "click") {
    setActiveCards((prevActiveCards) => {
      if (prevActiveCards.includes(cardId)) {
        return prevActiveCards.filter((id) => id !== cardId);
      } else {
        return [...prevActiveCards, cardId];
      }
    });
  } else if (eventType === "mouseover" || eventType === "mouseout") {
    setHoveredCard(eventType === "mouseover" ? cardId : "");
  }
};

	const getCardClass = (card, index) => {
		const classNames = ["displayCard"];
		if (card.id === hoveredCard) {
			classNames.push("hovered");
		}
		const pushIfCondition = (condition, className) => condition && classNames.push(className);
					pushIfCondition		(card.layout === "transform" || card.layout === "reversible_card" || card.layout === "modal_dfc", index === 1 ? "flip-card-back" : "flip-card-front");
					pushIfCondition		(card.layout === "transform" && card.type_line.includes("Siege"), index === 0 ? "siege" : "");
					pushIfCondition		(card.layout === "split" && !card.keywords.includes("Aftermath"), "split");
					pushIfCondition		(card.keywords.includes("Aftermath"), "aftermath");
		return classNames.join(" ");
	};

	const componentLabels = {
		token: '(Token)',
		meld_part: '(Part)',
		meld_result: '(Result)'
	};

	const renderImage = (card) => {
		if (card.image_uris && card.layout !== "meld" && card.layout !== "flip") {
			return (
				<div className={getCardClass(card)}>
					<img src={card.image_uris.normal} alt={card.name} />
				</div>
			);
		}
		if (card.layout === "flip") {
			return (
				<div className="upsidedown-container">
					<div className={`${activeCards.includes(card.id) ? 'upsidedown' : ''}`} onClick={() => handleCardEvent(card.id)}>
						<div className={getCardClass(card)}>
							<img src={card.image_uris.normal} alt={card.name} />
						</div>
					</div>
				</div>
			);
		}
		if (card.card_faces) {
			return (
				<div className="flip-card-container">
					<div className={`flip-card ${activeCards.includes(card.id) ? 'flipped' : 'flipped-back'}`} onClick={() => handleCardEvent(card.id)}>
						{card.card_faces.map((card_face, index) => (
							<div key={index} className={`${getCardClass(card, index)}`}>
								<img src={card_face.image_uris.normal} alt={card_face.name} />
							</div>
						))}
					</div>
				</div>
			);
		}
		if (card.all_parts && card.layout === "meld") {
			const sortedParts = [...card.all_parts].sort((a, b) => {
				const order = ['meld_part', 'token', 'meld_result'];
				return order.indexOf(a.component) - order.indexOf(b.component);
			});
			return (
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
		}
		return null;
	};

  return (
    <div>
			<form onSubmit={(e) => {
				e.preventDefault();
					searchCards();}}>
				<input
					type="text"
					value={query}
					placeholder="Search by name.."
					onChange={e => setQuery(e.target.value)}
				/>
				<button onClick={searchCards}>Search</button>
			</form>
			<div className="sorting">
				<select onChange={(e) => { sortCards(e.target.value); setSelectedSort(e.target.value); }} value={selectedSort}>
					<option value="" disabled>Sort by..</option>
					<option value="rarity">Sort by Rarity</option>
					<option value="layout">Sort by Layout</option>
					<option value="name">Sort by Name</option>
					<option value="color_identity">Sort by Color</option>
				</select>
			</div>
			<div className="pagination">
				<button onClick={prevPage} disabled={currentPage === 1 || isLoading}>Previous</button>
				{pageButtons.map((page) => (
					<button key={page} onClick={() => goToPage(page)} disabled={currentPage === page}>{page}</button>
				))}
				<button onClick={nextPage} disabled={currentPage === totalPages || !nextPageUrl || isLoading}>Next</button>
				{isLoading && <span>Loading...</span>}
			</div>
			Total Cards found: {totalCards}
			{errorMessage && <div>{errorMessage}</div>}
			<div className="cardContainer">
				{cards.map(card => (
					<div key={card.id} className="card">
						{/* {card.name} */}
						<div className="imgContainer"
							onMouseOver={(e) => handleCardEvent(e, card.id)}
							onMouseOut={(e) => handleCardEvent(e, card.id)}
							onClick={(e) => handleCardEvent(e, card.id)}
						>
							{renderImage(card)}
						</div>
						{/* Rarity: {card.rarity}
						<br />
						Layout: {card.layout}
						<br />
						Type Line: {card.type_line} */}
					</div>
				))}
			</div>
    </div>
  );
}

export default CardsDisplay;