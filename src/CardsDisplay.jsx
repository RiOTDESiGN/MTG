import React, { useState, useRef } from "react";
import axios from "axios";

function CardsDisplay() {
  const [query, 					setQuery] 					= useState("");
	const [errorMessageC, 	setErrorMessageC]		= useState('');
	const [errorMessageP,		setErrorMessageP]		= useState('');
  const [cards, 					setCards] 					= useState([]);
	const [totalCards, 			setTotalCards] 			= useState(0);
	const [selectedSort, 		setSelectedSort] 		= useState("");
	const [selectedColors, 	setSelectedColors] 	= useState([]);
	const [hoveredCard, 		setHoveredCard] 		= useState("");
	const [activeCards, 		setActiveCards] 		= useState([]);
	const [clickedCardName, setClickedCardName] = useState('');
	const [isModalOpen, 		setModalOpen] 			= useState(false);
	const [prints, 					setPrints] 					= useState([]);
	const [totalPrints, 		setTotalPrints] 		= useState(0);
	const [nextPageUrl, 		setNextPageUrl] 		= useState(null);
	const [prevPageUrl, 		setPrevPageUrl] 		= useState(null);
	const [isLoading, 			setIsLoading] 			= useState(false);

	const resetStates = () => {
		setCards([]);
		setNextPageUrl(null);
		setPrevPageUrl(null);
		setSelectedSort("");
		setTotalCards(0);
		setErrorMessageC("");
	}

	const searchCardsCache = useRef({});

	const Pagination = 
		<div className="pagination">
			<button onClick={() => searchCards(prevPageUrl)} disabled={!prevPageUrl || isLoading}>Previous</button>
			<button onClick={() => { setCards([]); searchCards(nextPageUrl); }} disabled={nextPageUrl === null || isLoading}>Next</button>
		</div>;

	const searchCards = async (urlToFetch) => {
		setIsLoading(true);
	
		try {
			let apiUrl = urlToFetch;
			if (!apiUrl) {
				apiUrl = `https://api.scryfall.com/cards/search?q=${query}`;
				if (selectedColors.length) {
					apiUrl += `+c=${selectedColors.join("")}`;
				}
			}
			const url = new URL(apiUrl);
			const page = url.searchParams.get("page") || '1';
			const cacheKey = `q=${query}_${selectedColors}_page=${page}`;
	
			let responseData;
	
			if (searchCardsCache[cacheKey]) {
				responseData = searchCardsCache[cacheKey];
				console.log("Fetching from cache");
			} else {
				responseData = await axios.get(apiUrl).then(res => res.data);
				searchCardsCache[cacheKey] = responseData;
				console.log("Fetching from API");
			}
	
			const { data, total_cards, has_more, next_page } = responseData;
			setCards(data);
			setTotalCards(total_cards);
			setNextPageUrl(has_more ? next_page : null);
	
			if (page) {
				const pageInt = parseInt(page);
				url.searchParams.set("page", pageInt > 1 ? pageInt - 1 : null);
				setPrevPageUrl(pageInt > 1 ? url.toString() : null);
			} else {
				setPrevPageUrl(null);
			}
	
		} catch (error) {
			const errorMessageC = error.response?.status === 404
				? "No cards found. Your search didn’t match any cards, please try again."
				: "Please type at least one letter in the searchbox, or select at least one color to search for.";
	
			setErrorMessageC(errorMessageC);
		} finally {
			setIsLoading(false);
			console.log("Current cache state:", searchCardsCache);
		}
	};

	const searchPrints = async (nameToSearch = clickedCardName) => {		
		setIsLoading(true);
		console.log('Fetching from API');
	
		try {
			let apiUrl = `https://api.scryfall.com/cards/search?order=released&q=!"${nameToSearch}"+include:extras&unique=prints`;
			const response = await axios.get(apiUrl);
			setPrints(response.data.data);
			setTotalPrints(response.data.total_cards);
			setIsLoading(false);
		} catch (error) {
			const errorMessageP = error.response && error.response.status === 404 ? "An error occurred" : error.message;
			setErrorMessageP(errorMessageP);
			setIsLoading(false);
		}
	};

	const cardsPerPage = 175;
	const totalPages = Math.ceil(totalCards / cardsPerPage);

	const compareByLocale = (val1, val2) => {
    if (val1 === undefined || val2 === undefined) return 0;
    const strippedVal1 = val1.startsWith("A-") ? val1.substring(2) : val1;
    const strippedVal2 = val2.startsWith("A-") ? val2.substring(2) : val2;
    return strippedVal1.localeCompare(strippedVal2);
};
	
	const getComparator = (criteria) => {
		if (criteria === 'color_identity') {
			return ({ color_identity: aColors = [] }, { color_identity: bColors = [] }) => {
				return compareByLocale(aColors.join(''), bColors.join(''));
			};
		}
		if (criteria === 'cmc') {
			return (a, b) => {
				const aCost = parseInt(a[criteria] || '0', 10);
				const bCost = parseInt(b[criteria] || '0', 10);
				return aCost - bCost;
			};
		}
		return (a, b) => compareByLocale(a[criteria], b[criteria]);
	};
	
	const rarityOrder = {
    common: 0,
    uncommon: 1,
    rare: 2,
    mythic: 3,
};

const compareByRarity = (val1, val2) => {
    if (val1 === undefined || val2 === undefined) return 0;
    const rarityValue1 = rarityOrder[val1];
    const rarityValue2 = rarityOrder[val2];

    if (rarityValue1 === undefined || rarityValue2 === undefined) {
        return val1.localeCompare(val2);
    }

    return rarityValue1 - rarityValue2;
};

const sortCards = (criteria) => {
	let comparator;
	if (criteria === 'rarity') {
			comparator = (a, b) => compareByRarity(a[criteria], b[criteria]);
	} else {
			comparator = getComparator(criteria);
	}

	const sortedCards = [...cards].sort(comparator);
	setCards(sortedCards);
};

const handleCardEvent = (event, cardId) => {
	if (isModalOpen) return;

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

const handleRightClick = (name) => {
  setClickedCardName(name);
  setErrorMessageP("");
  setModalOpen(true);
  searchPrints(name);
	document.body.classList.add('no-scroll');
};

const handleClose = () => {
  setPrints([]);
	setTotalPrints("");
	setModalOpen(false);
	document.body.classList.remove('no-scroll');
};

	const getCardClass = (card, index) => {
		const classNames = ["displayCard"];
		if (card.id === hoveredCard) {classNames.push("hovered");}
		const pushIfCondition = (condition, className) => condition && classNames.push(className);
		const layouts = ["transform", "reversible_card", "modal_dfc", "art_series"];
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

	const colorMapping = {
  'W': '#f9faf5',
  'U': '#0f68ab',
  'R': '#d31e2a',
  'B': '#160b00',
  'G': '#00743f'
};
	const colorOptions = ['W', 'U', 'R', 'B', 'G'];

	const handleColorChange = (e) => {
		const value = e.target.value;
		
		setSelectedColors(prevState =>
			prevState.includes(value)
				? prevState.filter(color => color !== value)
				: [...prevState, value]
		);
	};	

  return (
    <div>
			<div className="searchfield">
				<form onSubmit={(e) => {
					e.preventDefault();
						resetStates();
						searchCards();}}>
					<input
						type="text"
						value={query}
						placeholder="Search by name.."
						onChange={e => setQuery(e.target.value)}
					/>
					<button>Search</button>
					{totalCards > 0 && `${totalCards} cards over ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}.`}
				</form>
				{Pagination}
			</div>
			<div className="sorting">
				<div className="color-options">
					{colorOptions.map((colorCode, index) => (
						<label key={index}>
							<div 
								className="checkbox-container" 
								style={{ backgroundColor: colorMapping[colorCode] }}
							>
								<input
									type="checkbox"
									value={colorCode}
									onChange={handleColorChange}
								/>
							</div>
						</label>
					))}
				</div>
				<select onChange={(e) => { sortCards(e.target.value); setSelectedSort(e.target.value); }} value={selectedSort}>
					<option value="" disabled>Sort by..</option>
					<option value="rarity">Sort by Rarity</option>
					<option value="layout">Sort by Layout</option>
					<option value="name">Sort by Name</option>
					<option value="cmc">Sort by Mana Cost</option>
					<option value="color_identity">Sort by Color</option>
				</select>
			</div>
			{errorMessageC && <div>{errorMessageC}</div>}
			{isLoading && <div className="cards-loading">Loading...</div>}
			<div className="cardContainer">
				{isModalOpen && (
					<div className="modal">
						<button onClick={handleClose}>Close</button>
						{clickedCardName} - Total Prints found: {totalPrints}
						{isLoading && <span>Loading...</span>}
						{errorMessageP && <div>{errorMessageP}</div>}
						<div className="printsContainer">
							{prints.map(print => (
								<div key={print.id}>
									<img
										className="unique-print"
										src={print.card_faces ? print.card_faces[0].image_uris.normal : print.image_uris.normal}
										alt={print.name}
									/>
								</div>
							))}
						</div>
					</div>
				)}
				{cards.map(card => (
					<div key={card.id} className="card">
						<div className="imgContainer"
							onMouseOver={(e) => handleCardEvent(e, card.id)}
							onMouseOut={(e) => handleCardEvent(e, card.id)}
							onClick={(e) => handleCardEvent(e, card.id)}
							onContextMenu={(e) => {
								e.preventDefault();
								handleRightClick(card.name);
							}}
						>
							{renderImage(card)}
						</div>
						Rarity: {card.rarity}
						<br />
						Layout: {card.layout}
					</div>
				))}
			</div>
			{Pagination}
    </div>
  );
}

export default CardsDisplay;