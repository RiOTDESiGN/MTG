import React, { createContext, useState, useContext } from "react";

const CardsContext = createContext();

export const useCardsContext = () => useContext(CardsContext);

export const CardsContextProvider = ({ children }) => {
  const [cards, setCards] = useState([]);
  const [totalCards, setTotalCards] = useState(0);
  const [totalPrints, setTotalPrints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [cardsPerPage, setCardsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCards, setFilteredCards] = useState([]);
  const [filteredColors, setFilteredColors] = useState([]);
  const [searchColors, setSearchColors] = useState([]);
  const [disableElement, setDisableElement] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const displayedCards = filteredCards.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  const totalPages = Math.ceil(totalCards / cardsPerPage);

  const Pagination =
    totalPages < 2 ? null : (
      <div className="pagination">
        <button
          className={`button-prev ${
            currentPage === 0 || currentPage === 1 ? "disabled" : ""
          }`}
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0 || currentPage === 1}
        >
          <div className="arrow left"></div>
        </button>
        <div className="currentPage">
          {currentPage} / {totalPages}
        </div>
        <button
          className={`button-next ${
            currentPage * cardsPerPage >= totalCards ? "disabled" : ""
          }`}
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage * cardsPerPage >= totalCards}
        >
          <div className="arrow right"></div>
        </button>
      </div>
    );

  const colorFilters = [
    { label: "achromatic", code: "", color: "transparent" },
    { label: "white", code: "W", color: "#f9faf5" },
    { label: "blue", code: "U", color: "#0f68ab" },
    { label: "black", code: "B", color: "#160b00" },
    { label: "red", code: "R", color: "#d31e2a" },
    { label: "green", code: "G", color: "#00743f" },
  ];

  const contextValue = {
    cards,
    setCards,
    totalCards,
    setTotalCards,
    totalPrints,
    setTotalPrints,
    isLoading,
    setIsLoading,
    sortOrder,
    setSortOrder,
    selectedSort,
    setSelectedSort,
    cardsPerPage,
    setCardsPerPage,
    currentPage,
    setCurrentPage,
    filteredCards,
    setFilteredCards,
    filteredColors,
    setFilteredColors,
    searchColors,
    setSearchColors,
    displayedCards,
    Pagination,
    colorFilters,
    totalPages,
    setDisableElement,
    disableElement,
    showTooltip,
    setShowTooltip,
  };

  return (
    <CardsContext.Provider value={contextValue}>
      {children}
    </CardsContext.Provider>
  );
};
