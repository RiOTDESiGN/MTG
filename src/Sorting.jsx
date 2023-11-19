import React, { useEffect } from "react";
import { useCardsContext } from "./CardsContext";

export function Sorting() {
  const {
    cards,
    setCards,
    sortOrder,
    setSortOrder,
    selectedSort,
    setSelectedSort,
    cardsPerPage,
    setCardsPerPage,
    currentPage,
    setTotalCards,
    setFilteredCards,
    displayedCards,
    Pagination,
    colorFilters,
    setCurrentPage,
    filteredColors,
    setFilteredColors,
  } = useCardsContext();

  const sortCards = (criteria) => {
    let originalComparator = getComparator(criteria);

    if (criteria === "rarity") {
      originalComparator = (a, b) => compareByRarity(a[criteria], b[criteria]);
    }

    let comparator = originalComparator;

    if (sortOrder === "desc") {
      comparator = (a, b) => -originalComparator(a, b);
    }

    const sortedCards = [...cards].sort(comparator);
    setCards(sortedCards);
  };

  useEffect(() => {
    sortCards(selectedSort);
  }, [sortOrder]);

  useEffect(() => {
    const newFilteredCards = cards.filter((card) => {
      if (card.color_identity.length === 0) {
        return !filteredColors.includes("");
      }
      return !card.color_identity.some((color) =>
        filteredColors.includes(color)
      );
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
    if (criteria === "color_identity") {
      return (
        { color_identity: aColors = [] },
        { color_identity: bColors = [] }
      ) => {
        const aScore = aColors.reduce(
          (acc, color) => acc + colorOrder[color],
          0
        );
        const bScore = bColors.reduce(
          (acc, color) => acc + colorOrder[color],
          0
        );
        return aScore - bScore;
      };
    }
    if (criteria === "cmc") {
      return (a, b) => {
        const aCost = parseInt(a[criteria] || "0", 10);
        const bCost = parseInt(b[criteria] || "0", 10);
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

  const handleColorFilterChange = (color) => {
    setFilteredColors((prevFilteredColors) =>
      prevFilteredColors.includes(color)
        ? prevFilteredColors.filter((c) => c !== color)
        : [...prevFilteredColors, color]
    );
  };

  const ColorOption = ({
    colorCode,
    color,
    isSelected,
    onChange,
    disabled,
  }) => (
    <div className="checkbox-container" style={{ backgroundColor: color }}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onChange(colorCode)}
        disabled={disabled}
      />
    </div>
  );

  const handleCardsPerPageChange = (newCardsPerPage) => {
    setCardsPerPage(newCardsPerPage);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex">
        <div className="flex flex-h">
          <select
            className="cards-per-page"
            onChange={(e) =>
              handleCardsPerPageChange(parseInt(e.target.value, 10))
            }
            value={cardsPerPage}
          >
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
            <option value="" disabled>
              Select sorting order..
            </option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        {Pagination}
      </div>
      <div className="flex">
        <select
          className="select-sorting"
          onChange={(e) => {
            sortCards(e.target.value);
            setSelectedSort(e.target.value);
            setSortOrder("asc");
          }}
          value={selectedSort}
          disabled={displayedCards.length === 0}
        >
          <option value="" disabled>
            Sort cards by..
          </option>
          <option value="name">Name</option>
          <option value="cmc">Mana Cost</option>
          <option value="layout">Layout (split, flip, transform, ...)</option>
          <option value="color_identity">
            Color (white, blue, black, red, green)
          </option>
          <option value="rarity">Rarity (common, uncommon, rare, ...)</option>
        </select>
        <div className="spacer"></div>
        <div className="color-options">
          {colorFilters.map(({ label, code, color }) => (
            <div
              key={code}
              className={`${label === "achromatic" ? "new-line" : ""}`}
            >
              {label === "achromatic" && "Remove cards by Color Identity :"}
              <ColorOption
                key={code}
                colorCode={code}
                color={color}
                isSelected={filteredColors.includes(code)}
                onChange={handleColorFilterChange}
                disabled={
                  displayedCards.length === 0 && filteredColors.length === 0
                }
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
