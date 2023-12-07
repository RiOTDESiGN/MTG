import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Card from "./Card";
import { Sorting } from "./Sorting";
import { ScrollButtons } from "./ScrollButtons";
import { useCardsContext } from "./CardsContext";

function CardsDisplay() {
  const {
    setCards,
    totalCards,
    setTotalCards,
    totalPrints,
    setTotalPrints,
    isLoading,
    setIsLoading,
    setSortOrder,
    setSelectedSort,
    setCurrentPage,
    displayedCards,
    Pagination,
    colorFilters,
    setFilteredColors,
    searchColors,
    setSearchColors,
    totalPages,
    setDisableElement,
  } = useCardsContext();

  const queryRef = useRef(null);
  useEffect(() => {
    if (queryRef.current) {
      queryRef.current.focus();
    }
  }, []);

  const selectedColorsRef = useRef([]);

  const [errorMessageC, setErrorMessageC] = useState("");
  const [errorMessageP, setErrorMessageP] = useState("");
  const [clickedCardName, setClickedCardName] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [prints, setPrints] = useState([]);
  const [isExclamationChecked, setIsExclamationChecked] = useState(false);

  const resetStates = () => {
    setCards([]);
    setSortOrder("");
    setSelectedSort("");
    setTotalCards(0);
    setErrorMessageC("");
    setFilteredColors([]);
    setSearchColors([]);
  };

  const searchCardsCache = useRef({});

  console.log("Component re-rendered");

  const createCacheKey = (query, selectedColors, page) =>
    `query=${query}_colors=${selectedColors}_page=${page}`;

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

    const data = await axios.get(apiUrl).then((res) => res.data);
    cache[cacheKey] = data;
    console.log("Fetching from API");
    return data;
  };

  const searchCards = async (initialApiUrl) => {
    setIsLoading(true);
    const cards = [];
    let query = queryRef.current
      ? queryRef.current.value.replace(/\s+/g, "")
      : "";

    if (isExclamationChecked) {
      query = "!" + query;
    }

    setDisableElement(
      queryRef.current.value.trim() === "" ||
        selectedColorsRef.current.length > 0
    );

    try {
      let apiUrl =
        initialApiUrl ||
        `https://api.scryfall.com/cards/search?q=(not:digital)${query}`;

      if (query === "") {
        document.getElementById("searchedName").innerText = "";
      }

      if (selectedColorsRef.current.length) {
        apiUrl += `+c="${selectedColorsRef.current.join("")}"`;
      } else {
        document.getElementById("searchedColors").textContent = "";
      }

      do {
        const url = new URL(apiUrl);
        const page = url.searchParams.get("page") || "1";
        const cacheKey = createCacheKey(query, selectedColorsRef.current, page);
        const { data, has_more, next_page } = await fetchData(
          apiUrl,
          cacheKey,
          searchCardsCache
        );

        cards.push(...data);
        apiUrl = has_more ? next_page : null;

        await new Promise((resolve) => setTimeout(resolve, 50));
      } while (apiUrl);

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
    console.log("Fetching from API");

    try {
      let apiUrl = `https://api.scryfall.com/cards/search?order=released&q=(not:digital)!"${nameToSearch}"+include:extras&unique=prints`;
      const response = await axios.get(apiUrl);
      setPrints(response.data.data);
      setTotalPrints(response.data.total_cards);
      setIsLoading(false);
    } catch (error) {
      const errorMessageP =
        error.response && error.response.status === 404
          ? "An error occurred"
          : error.message;
      setErrorMessageP(errorMessageP);
      setIsLoading(false);
    }
  };

  const handleRightClick = (name) => {
    setClickedCardName(name);
    setErrorMessageP("");
    setModalOpen(true);
    searchPrints(name);
    document.body.classList.add("no-scroll");
  };

  const handleClose = () => {
    setPrints([]);
    setTotalPrints("");
    setModalOpen(false);
    document.body.classList.remove("no-scroll");
  };

  function formatColors(colors) {
    const len = colors.length;
    if (len === 0) return "";
    if (len === 1) return colors[0];
    if (len === 2) return `${colors[0]} and ${colors[1]}`;
    return `${colors.slice(0, len - 1).join(", ")} and ${colors[len - 1]}`;
  }

  const handleColorSearch = (colorCode) => {
    if (displayedCards.length > 0) {
      document.getElementById("searchedName").innerText = "";
      document.getElementById("searchedColors").innerText = "";
      setCards([]);
      setFilteredColors([]);
      setErrorMessageC("");
    }
    const selectedColors = selectedColorsRef.current;
    const isAchromaticSelected = colorCode === "";
    const updatedSelectedColors = isAchromaticSelected
      ? selectedColors.includes("")
        ? []
        : [""]
      : selectedColors.includes(colorCode)
      ? selectedColors.filter((color) => color !== colorCode)
      : [...selectedColors, colorCode];

    selectedColorsRef.current = updatedSelectedColors;
    setSearchColors(updatedSelectedColors);

    updateCheckboxes();

    const fullColorNames = selectedColorsRef.current
      .map((colorCode) => {
        const foundFilter = colorFilters.find(
          (filter) => filter.code === colorCode
        );
        return foundFilter ? foundFilter.label : "";
      })
      .join(", ");
    document.getElementById("searchedColors").textContent = formatColors(
      fullColorNames.split(", ").filter(Boolean)
    );
    updateVisibility();
  };

  const updateCheckboxes = () => {
    const selectedColors = selectedColorsRef.current;
    const checkboxes = document.querySelectorAll(".custom-checkbox");

    checkboxes.forEach((checkbox) => {
      const colorCode = checkbox.id.replace("checkbox-", "");
      checkbox.checked = selectedColors.includes(colorCode);
    });
  };

  const ColorSearch = ({ colorCode, color, isWhite, checked, onChange }) => (
    <div className="checkbox-container" style={{ backgroundColor: color }}>
      <input
        type="checkbox"
        id={`checkbox-${colorCode}`}
        className={`custom-checkbox ${isWhite ? "white-checkbox" : ""}`}
        checked={checked}
        onChange={() => onChange(colorCode)}
      />
      <label htmlFor={`checkbox-${colorCode}`}>
        <span className="checkbox-style"></span>
      </label>
    </div>
  );

  const resetCheckboxes = () => {
    selectedColorsRef.current = [];
  };

  const handleInput = () => {
    if (displayedCards.length > 0) {
      document.getElementById("searchedColors").innerText = "";
      setCards([]);
      setFilteredColors([]);
    }
    const inputValue = queryRef.current.value;
    document.getElementById("searchedName").innerText = inputValue;
    updateVisibility();
    setErrorMessageC("");
  };

  function updateVisibility() {
    const searchResults = document.getElementById("searchResults");
    const searchedName = document.getElementById("searchedName");
    const searchedColors = document.getElementById("searchedColors");
    const wordText = document.getElementById("wordText");

    if (errorMessageC) {
      searchResults.style.display = "none";
    }

    if (
      searchedName.textContent.trim().length === 0 &&
      searchedColors.textContent.trim().length === 0
    ) {
      searchResults.style.display = "none";
    }

    if (
      searchedName.textContent.trim().length > 0 ||
      searchedColors.textContent.trim().length > 0
    ) {
      searchResults.style.display = "inline-block";
    }

    if (searchedName.textContent.trim().length > 0) {
      wordText.style.display = "inline-block";
    } else {
      wordText.style.display = "none";
    }
  }

  useEffect(() => {
    updateVisibility();
  }, []);

  return (
    <div>
      <div className="controls">
        <div className="control-buttons">
          <div className="flex">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                resetStates();
                searchCards();
                queryRef.current.value = "";
              }}
            >
              <div className="flex flex-h">
                <input
                  id="search"
                  name="search"
                  type="text"
                  ref={queryRef}
                  placeholder="Search by name.."
                  onInput={handleInput}
                />
                <button type="submit">Search</button>
              </div>
              <div className="exclamation">
                Search for this exact card:
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="exclamation-checkbox"
                    className="custom-checkbox"
                    checked={isExclamationChecked}
                    onChange={() =>
                      setIsExclamationChecked(!isExclamationChecked)
                    }
                    onClick={() => {
                      if (displayedCards.length > 0) {
                        setCards([]);
                      }
                    }}
                  />
                  <label htmlFor="exclamation-checkbox">
                    {" "}
                    <span className="checkbox-style"></span>
                  </label>
                </div>
              </div>
            </form>
            <div className="color-options">
              {colorFilters.map(({ label, code, color }) => (
                <div
                  key={code}
                  className={label === "achromatic" ? "new-line" : ""}
                >
                  {label === "achromatic" && "Find cards by Color Identity :"}
                  <ColorSearch
                    colorCode={code}
                    color={color}
                    checked={selectedColorsRef.current.includes(code)}
                    onChange={handleColorSearch}
                    isWhite={label === "white"}
                  />
                </div>
              ))}
            </div>
          </div>
          <Sorting />
        </div>
        <div className="search-results-container">
          {errorMessageC && <div>{errorMessageC}</div>}
          <div id="searchResults" className="search-results">
            {totalCards > 0 ? "You searched" : "You're searching"}
            &nbsp;for {isExclamationChecked && "the "}
            <span id="searchedColors"></span>
            {searchColors && " "}
            {isExclamationChecked ? "card" : " cards "}
            <div className="search-results-visible" id="wordText">
              {!isExclamationChecked && "containing the word"}&nbsp;"
              <span id="searchedName"></span>"
            </div>
            {totalCards > 0 &&
              !isExclamationChecked &&
              `, and found ${totalCards} ${totalCards === 1 ? "card" : "cards"}.
              ${
                totalCards === 1 ? "This is" : "These are"
              } currently displayed ${
                totalPages === 1 ? "on" : "over"
              } ${totalPages} ${totalPages === 1 ? "page" : "pages"}.`}
          </div>
        </div>
      </div>
      {isLoading && <div className="cards-loading">Loading...</div>}
      {displayedCards.length === 0 && (
        <div className="nocards">
          Search for cards or remove one of your color-filters.
        </div>
      )}
      <div className="cardContainer">
        {isModalOpen && (
          <div className="modal">
            <button type="button" onClick={handleClose}>
              X
            </button>
            {clickedCardName} - Total Prints found: {totalPrints}
            {isLoading && <span>Loading...</span>}
            {errorMessageP && <div>{errorMessageP}</div>}
            <div className="printsContainer">
              {prints.map((print) => {
                let images;
                if (print.card_faces && print.card_faces.length > 0) {
                  images = print.card_faces.map((face, index) => (
                    <img
                      key={index}
                      className="unique-print"
                      src={face.image_uris.normal}
                      alt={`${print.name} - Face ${index + 1}`}
                    />
                  ));
                } else {
                  images = (
                    <img
                      className="unique-print"
                      src={print.image_uris.normal}
                      alt={print.name}
                    />
                  );
                }

                return <div key={print.id}>{images}</div>;
              })}
            </div>
          </div>
        )}
        {displayedCards.map((card) => (
          <div key={card.id} className="card">
            <Card
              card={card}
              handleRightClick={handleRightClick}
              setClickedCardName={setClickedCardName}
              isModalOpen={isModalOpen}
              setErrorMessageP={setErrorMessageP}
            />
          </div>
        ))}
      </div>
      {Pagination}
      {displayedCards.length > 20 && <ScrollButtons />}
    </div>
  );
}

export default CardsDisplay;
