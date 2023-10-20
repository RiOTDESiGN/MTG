import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

function CardsDisplay() {
	const queryRef = useRef(null);

	const [errorMessageC, 			setErrorMessageC]				= useState('');
	const [errorMessageP,				setErrorMessageP]				= useState('');
  const [cards, 							setCards] 							= useState([]);
	const [totalCards, 					setTotalCards] 					= useState(0);
	const [selectedSort, 				setSelectedSort] 				= useState("");
	const [sortOrder, 					setSortOrder] 					= useState('');
	const [selectedColors, 			setSelectedColors] 			= useState([]);
	const [filteredCards, 			setFilteredCards] 			= useState([]);
	const [filteredColors, 			setFilteredColors] 			= useState([]);
	const [hoveredCard, 				setHoveredCard] 				= useState("");
	const [activeCards, 				setActiveCards] 				= useState([]);
	const [clickedCardName, 		setClickedCardName] 		= useState('');
	const [isModalOpen, 				setModalOpen] 					= useState(false);
	const [prints, 							setPrints] 							= useState([]);
	const [totalPrints, 				setTotalPrints] 				= useState(0);
	const [cardsPerPage, 				setCardsPerPage] 				= useState(50);
	const [currentPage,					setCurrentPage]					= useState(1);
	const [isLoading, 					setIsLoading] 					= useState(false);
	const [showScrollToTop, 		setShowScrollToTop] 		= useState(false);
  const [showScrollToBottom, 	setShowScrollToBottom] 	= useState(true);

	const resetStates = () => {
		setCards([]);
		setSortOrder('');
		setSelectedSort("");
		setTotalCards(0);
		setErrorMessageC("");
	}

	const searchCardsCache = useRef({});

	const handleCardsPerPageChange = (newCardsPerPage) => {
		setCardsPerPage(newCardsPerPage);
		setCurrentPage(1);
	};
	
console.log(currentPage);

console.log(cardsPerPage);


const createCacheKey = (query, selectedColors, page) => `query=${query}_colors=${selectedColors}_page=${page}`;

const getErrorMessage = (error) => {
  return error.response?.status === 404
    ? "No cards found. Your search didn’t match any cards, please try again."
    : "Please type at least one letter in the searchbox, or select at least one color to search for.";
};

const fetchData = async (apiUrl, cacheKey, cache) => {
  if (cache[cacheKey]) {
    console.log("Fetching from cache");
    return cache[cacheKey];
  }
  
  const data = await axios.get(apiUrl).then(res => res.data);
  cache[cacheKey] = data;
  console.log("Fetching from API");
  return data;
};

const searchCards = async (initialApiUrl) => {
  setIsLoading(true);
  const cards = [];
	const query = queryRef.current ? queryRef.current.value : '';

  try {
    let apiUrl = initialApiUrl || `https://api.scryfall.com/cards/search?q=${query}`;

    if (selectedColors.length) {
      apiUrl += `+c="${selectedColors.join("")}"`;
    }

    do {
      const url = new URL(apiUrl);
      const page = url.searchParams.get("page") || '1';
      const cacheKey = createCacheKey(query, selectedColors, page);
      const { data, has_more, next_page } = await fetchData(apiUrl, cacheKey, searchCardsCache);

      cards.push(...data);
      apiUrl = has_more ? next_page : null;

      await new Promise(resolve => setTimeout(resolve, 50));

    } while(apiUrl);
		
		setCards(cards);
    setCurrentPage(1);

  } catch (error) {
    const errorMessageC = getErrorMessage(error);
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

	const compareByLocale = (val1, val2) => {
    if (val1 === undefined || val2 === undefined) return 0;
    const strippedVal1 = val1.startsWith("A-") ? val1.substring(2) : val1;
    const strippedVal2 = val2.startsWith("A-") ? val2.substring(2) : val2;
    return strippedVal1.localeCompare(strippedVal2);
	};
	
	const colorOrder = {
		C: 0,
		W: 1,
		U: 2,
		B: 3,
		R: 4,
		G: 5,
	};
	
	const getComparator = (criteria) => {
		if (criteria === 'color_identity') {
			return ({ color_identity: aColors = [] }, { color_identity: bColors = [] }) => {
				const aScore = aColors.reduce((acc, color) => acc + colorOrder[color], 0);
				const bScore = bColors.reduce((acc, color) => acc + colorOrder[color], 0);
				return aScore - bScore;
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
	let originalComparator = getComparator(criteria);

	if (criteria === 'rarity') {
			originalComparator = (a, b) => compareByRarity(a[criteria], b[criteria]);
	}

	let comparator = originalComparator;

	if (sortOrder === 'desc') {
		comparator = (a, b) => -originalComparator(a, b);
	}

	const sortedCards = [...cards].sort(comparator);
	setCards(sortedCards);
};

useEffect(() => {
  sortCards(selectedSort);
}, [sortOrder]);

useEffect(() => {
	const newFilteredCards = cards.filter(card => {
		if (card.color_identity.length === 0) {
			return !filteredColors.includes('');
		}
		return !card.color_identity.some(color => filteredColors.includes(color));
	});

	setTotalCards(newFilteredCards.length);
	setFilteredCards(newFilteredCards);

	if (newFilteredCards.length > 0) {
		if (currentPage * cardsPerPage >= newFilteredCards.length) {
			setCurrentPage(Math.ceil(newFilteredCards.length / cardsPerPage));
		}
	} else {
		setCurrentPage(1);
	}

}, [filteredColors, cards, cardsPerPage, currentPage]);



const displayedCards = filteredCards.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);
const totalPages = Math.ceil(totalCards / cardsPerPage);

	const Pagination = 
		<div className="pagination">
			<select className="cards-per-page" onChange={(e) => handleCardsPerPageChange(parseInt(e.target.value, 10))} value={cardsPerPage}>
				<option value={50}>50</option>
				<option value={100}>100</option>
				<option value={250}>250</option>
				<option value={500}>500</option>
				<option value={1000}>1000</option>
			</select>
			<button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0 || currentPage === 1}>Previous</button>
			<div className="currentPage">{currentPage}</div>
			<button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage * cardsPerPage >= totalCards}>Next</button>
		</div>;


const handleCardEvent = (event, cardId) => {
	if (isModalOpen) return;

  if (event.type === "click") {
    setActiveCards((prevActiveCards) => {
      const newActiveCards = new Set(prevActiveCards);
      newActiveCards.has(cardId) ? newActiveCards.delete(cardId) : newActiveCards.add(cardId);
      return Array.from(newActiveCards);
    });
  } else if (event.type === "mouseover" || event.type === "mouseout") {
    setHoveredCard(event.type === "mouseover" ? cardId : "");
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

	const colorFilters = [
		{ label: 'None', code: '', color: 'transparent' },
		{ label: 'White', code: 'W', color: '#f9faf5' },
		{ label: 'Blue', code: 'U', color: '#0f68ab' },
		{ label: 'Black', code: 'B', color: '#160b00' },
		{ label: 'Red', code: 'R', color: '#d31e2a' },
		{ label: 'Green', code: 'G', color: '#00743f' },
	];

	const handleColorChange = (colorCode) => {
		setSelectedColors(prevState => {
			if (colorCode === '') {
				return prevState.includes('') ? [] : [''];
			}
			const otherColors = prevState.filter(color => color !== '');
			return otherColors.includes(colorCode)
				? otherColors.filter(color => color !== colorCode)
				: [...otherColors, colorCode];
		});
	};

	const handleColorFilterChange = (color) => {
		setFilteredColors(prevFilteredColors => {
			if (prevFilteredColors.includes(color)) {
				return prevFilteredColors.filter(c => c !== color);
			} else {
				return [...prevFilteredColors, color];
			}
		});
	};

	const ColorOption = ({ colorCode, color, isSelected, onChange }) => (
		<div 
			className="checkbox-container" 
			style={{ backgroundColor: color }}
		>
			<input
				type="checkbox"
				checked={isSelected}
				onChange={() => onChange(colorCode)}
			/>
		</div>
	);	

  const bottomThreshold = 600;

	const checkScrollPosition = () => {
		const scrolledFromTop = window.scrollY;
		const scrolledToTop = scrolledFromTop <= bottomThreshold;
		const scrolledToBottom = window.innerHeight + scrolledFromTop >= document.body.scrollHeight;
	
		setShowScrollToTop(!scrolledToTop);
		setShowScrollToBottom(!scrolledToBottom && scrolledFromTop > bottomThreshold);
	};	

  useEffect(() => {
    window.addEventListener('scroll', checkScrollPosition);

    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
    };
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
			<div className="controls">
				<div className="searchfield">
					<form onSubmit={(e) => {
						e.preventDefault();
							resetStates();
							searchCards();}}>
						<input
							type="text"
							ref={queryRef}
							placeholder="Search by name.."
						/>
						<button>Search</button>
					</form>
					<div className="color-options">
						{colorFilters.map(({ label, code, color }) => (
							<div key={code} className={label === 'None' ? 'new-line' : ''}>
								{label === 'None' && "Search for colorless or colors :"}
								<ColorOption 
									colorCode={code}
									color={color}
									isSelected={selectedColors.includes(code)}
									onChange={handleColorChange}
								/>
							</div>
						))}
					</div>
				</div>
				<select 
					value={sortOrder} 
					onChange={(e) => setSortOrder(e.target.value)}
					disabled={!selectedSort}
				>
					<option value="" disabled>Select sorting order..</option>
					<option value="asc">Ascending</option>
					<option value="desc">Descending</option>
				</select>
				<div className="sorting">
					{Pagination}
					<select className="select-sorting" onChange={(e) => { sortCards(e.target.value); setSelectedSort(e.target.value); }} value={selectedSort}>
						<option value="" disabled>Sort cards by..</option>
						<option value="name">Name</option>
						<option value="cmc">Mana Cost</option>
						<option value="layout">Layout (split, flip, transform, ...)</option>
						<option value="color_identity">Color (white, blue, black, red, green)</option>
						<option value="rarity">Rarity (common, uncommon, rare, ...)</option>
					</select>
					<div className="spacer"></div>
					<div className="color-options">
						{colorFilters.map(({ label, code, color }) => (
							<div key={code} className={label === 'None' ? 'new-line' : ''}>
								{label === 'None' && "Remove cards by Color Identity :"}
								<ColorOption 
									key={code}
									colorCode={code}
									color={color}
									isSelected={filteredColors.includes(code)}
									onChange={handleColorFilterChange}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="search-results">{totalCards > 0 && `${totalCards} cards over ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}.`}</div>
			{errorMessageC && <div>{errorMessageC}</div>}
			{isLoading && <div className="cards-loading">Loading...</div>}
			<div className="cardContainer">
				{isModalOpen && (
					<div className="modal">
						<button onClick={handleClose}>X</button>
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
				{displayedCards.map(card => (
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
						{/* Rarity: {card.rarity}
						<br />
						Layout: {card.layout} */}
					</div>
				))}
			</div>
			{Pagination}
      {displayedCards.length > 20 && (
        <>
          {showScrollToTop && <button className="scrollButton scrollToTop" onClick={scrollToTop}>↑</button>}
          {showScrollToBottom && <button className="scrollButton scrollToBottom" onClick={scrollToBottom}>↓</button>}
        </>
      )}
    </div>
  );
}

export default CardsDisplay;