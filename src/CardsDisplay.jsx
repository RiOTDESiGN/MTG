import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Card from './Card';

function CardsDisplay() {
	const queryRef = useRef(null);
	const selectedColorsRef = useRef([]);

	const [errorMessageC, 			setErrorMessageC]				= useState('');
	const [errorMessageP,				setErrorMessageP]				= useState('');
  const [cards, 							setCards] 							= useState([]);
	const [totalCards, 					setTotalCards] 					= useState(0);
	const [selectedSort, 				setSelectedSort] 				= useState("");
	const [sortOrder, 					setSortOrder] 					= useState('');
	const [filteredCards, 			setFilteredCards] 			= useState([]);
	const [filteredColors, 			setFilteredColors] 			= useState([]);
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
		setFilteredColors([]);
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

		if (query === '') {
			document.getElementById("searchedName").innerText = '';
		}

    if (selectedColorsRef.current.length) {
      apiUrl += `+c="${selectedColorsRef.current.join("")}"`;
    } else {
			document.getElementById("searchedColors").textContent = '';
		}

    do {
      const url = new URL(apiUrl);
      const page = url.searchParams.get("page") || '1';
      const cacheKey = createCacheKey(query, selectedColorsRef.current, page);
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
		resetCheckboxes();
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

const Pagination = totalPages < 2 ? null : (
	<div className="pagination">
		<button className="button-prev" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0 || currentPage === 1}>
			<div className="arrow left"></div>
		</button>
		<div className="currentPage">{currentPage} / {totalPages}</div>
		<button className="button-next" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage * cardsPerPage >= totalCards}>
			<div className="arrow right"></div>
		</button>
	</div>
);

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

	const colorFilters = [
		{ label: 'achromatic', code: '', color: 'transparent' },
		{ label: 'white', code: 'W', color: '#f9faf5' },
		{ label: 'blue', code: 'U', color: '#0f68ab' },
		{ label: 'black', code: 'B', color: '#160b00' },
		{ label: 'red', code: 'R', color: '#d31e2a' },
		{ label: 'green', code: 'G', color: '#00743f' },
	];

	function formatColors(colors) {
		const len = colors.length;
		if (len === 0) return '';
		if (len === 1) return colors[0];
		if (len === 2) return `${colors[0]} and ${colors[1]}`;
		return `${colors.slice(0, len - 1).join(', ')} and ${colors[len - 1]}`;
	}	

	const handleColorSearch = (e, colorCode) => {
		const selectedColors = selectedColorsRef.current;
		const checkbox = e.target;
		
		if (colorCode === '') {
			selectedColorsRef.current = selectedColors.includes('') ? [] : [''];
			checkbox.checked = selectedColorsRef.current.includes('');
		} else {
			const otherColors = selectedColors.filter(color => color !== '');
			if (otherColors.includes(colorCode)) {
				selectedColorsRef.current = otherColors.filter(color => color !== colorCode);
				checkbox.checked = false;
			} else {
				selectedColorsRef.current = [...otherColors, colorCode];
				checkbox.checked = true;
			}
		}
		const fullColorNames = selectedColorsRef.current.map(colorCode => {
			const foundFilter = colorFilters.find(filter => filter.code === colorCode);
			return foundFilter ? foundFilter.label : '';
		}).join(", ");
		document.getElementById("searchedColors").textContent = formatColors(fullColorNames.split(", ").filter(Boolean));
	};	

	const ColorSearch = ({ colorCode, color }) => (
		<div 
			className="checkbox-container" 
			style={{ backgroundColor: color }}
		>
			<input
				type="checkbox"
				onChange={(e) => handleColorSearch(e, colorCode)}
			/>
		</div>
	);

	const handleColorFilterChange = (color) => {
		setFilteredColors(prevFilteredColors => 
			prevFilteredColors.includes(color) 
				? prevFilteredColors.filter(c => c !== color)
				: [...prevFilteredColors, color]
		);
	};	

	const ColorOption = ({ colorCode, color, isSelected, onChange, disabled }) => (
		<div 
			className="checkbox-container" 
			style={{ backgroundColor: color }}
		>
			<input
				type="checkbox"
				checked={isSelected}
				onChange={() => onChange(colorCode)}
				disabled={disabled}
			/>
		</div>
	);

	const resetCheckboxes = () => {selectedColorsRef.current = [];};	

  const bottomThreshold = 500;

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

	const handleInput = () => {
		const inputValue = queryRef.current.value;
		document.getElementById("searchedName").innerText = inputValue;
	}

  return (
    <div>
			<div className="controls">
				<div className="control-buttons">
					<div className="flex">
						<form onSubmit={(e) => {
							e.preventDefault();
								resetStates();
								searchCards();
								queryRef.current.value = '';
								}}>
							<input
								type="text"
								ref={queryRef}
								placeholder="Search by name.."
								onInput={handleInput}
							/>
							<button>Search</button>
						</form>
						<div className="color-options">
							{colorFilters.map(({ label, code, color }) => (
								<div key={code} className={label === 'achromatic' ? 'new-line' : ''}>
									{label === 'achromatic' && "Find cards by Color Identity :"}
									<ColorSearch
										colorCode={code}
										color={color}
										isSelected={selectedColorsRef.current.includes(code)}
										onChange={handleColorSearch}
									/>
								</div>
							))}
						</div>
					</div>
					<div className="flex">
						<div className="flex flex-h">
							<select className="cards-per-page" onChange={(e) => handleCardsPerPageChange(parseInt(e.target.value, 10))} value={cardsPerPage}>
								<option value={50}>50</option>
								<option value={100}>100</option>
								<option value={250}>250</option>
								<option value={500}>500</option>
								<option value={1000}>1000</option>
							</select>
							<select
								value={sortOrder}
								onChange={(e) => setSortOrder(e.target.value)}
								disabled={!selectedSort}
							>
								<option value="" disabled>Select sorting order..</option>
								<option value="asc">Ascending</option>
								<option value="desc">Descending</option>
							</select>
						</div>
						{Pagination}
					</div>
					<div className="flex">
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
								<div key={code} className={`${label === 'achromatic' ? 'new-line' : ''}`}>
									{label === 'achromatic' && "Remove cards by Color Identity :"}
									<ColorOption
										key={code}
										colorCode={code}
										color={color}
										isSelected={filteredColors.includes(code)}
										onChange={handleColorFilterChange}
										disabled={displayedCards.length === 0 && filteredColors.length === 0}
									/>
								</div>
							))}
						</div>
					</div>
				</div>
				<div className="search-results-container">
					<div className="search-results">
						You're searching for <span id="searchedColors"></span> cards containing the word "<span id="searchedName"></span>"
						{totalCards > 0 && `, and found ${totalCards} ${totalCards === 1 ? 'card' : 'cards'}.
						${totalCards === 1 ? 'This is' : 'These are'} currently displayed ${totalPages === 1 ? 'on' : 'over'} ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}.`}
					</div>
				</div>
			</div>
			{errorMessageC && <div>{errorMessageC}</div>}
			{isLoading && <div className="cards-loading">Loading...</div>}
			{displayedCards.length === 0 && <div className="nocards">Search for cards or remove one of your color-filters.</div>}
			<div className="cardContainer">
				{isModalOpen && (
					<div className="modal">
						<button onClick={handleClose}>X</button>
						{clickedCardName} - Total Prints found: {totalPrints}
						{isLoading && <span>Loading...</span>}
						{errorMessageP && <div>{errorMessageP}</div>}
						<div className="printsContainer">
							{prints.map(print => {
								const imageSrc = (print.layout === "flip" || print.layout === "split" || print.layout === "aftermath" ? print.image_uris.normal : (print.card_faces ? print.card_faces[0].image_uris.normal : print.image_uris.normal));
								return (
									<div key={print.id}>
										<img
											className="unique-print"
											src={imageSrc}
											alt={print.name}
										/>
									</div>
								);
							})}
						</div>
					</div>
				)}
				{displayedCards.map(card => (
					<div key={card.id} className="card">
						<Card
							card={card}
							handleRightClick={handleRightClick}
							setClickedCardName={setClickedCardName}
							isModalOpen={isModalOpen}
							setErrorMessageP={setErrorMessageP} />
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