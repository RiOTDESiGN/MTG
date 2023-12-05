import React, { useEffect } from "react";
import { useCardsContext } from "./CardsContext";
import CustomSelect from "./CustomSelect";

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
    totalCards,
    setTotalCards,
    setFilteredCards,
    displayedCards,
    Pagination,
    colorFilters,
    setCurrentPage,
    filteredColors,
    setFilteredColors,
    disableElement,
    showTooltip,
    setShowTooltip,
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

  // const handleColorFilterChange = (color) => {
  //   setFilteredColors((prevFilteredColors) =>
  //     prevFilteredColors.includes(color)
  //       ? prevFilteredColors.filter((c) => c !== color)
  //       : [...prevFilteredColors, color]
  //   );
  // };

  const handleColorFilterChange = (color) => {
    setFilteredColors((prevFilteredColors) => {
      const isColorNotSelected = !prevFilteredColors.includes(color);

      if (
        isColorNotSelected &&
        prevFilteredColors.length === colorFilters.length - 1
      ) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
        return prevFilteredColors;
      }

      setShowTooltip(false);
      return isColorNotSelected
        ? [...prevFilteredColors, color]
        : prevFilteredColors.filter((c) => c !== color);
    });
  };

  const ColorOption = ({
    colorCode,
    color,
    isSelected,
    onChange,
    disabled,
    isWhite,
  }) => (
    <div
      className={`checkbox-container ${disabled ? "disabled" : ""}`}
      style={{ backgroundColor: color }}
    >
      <input
        type="checkbox"
        id={`checkboxfilter-${colorCode}`}
        className={`custom-checkbox ${isWhite ? "white-checkbox" : ""}`}
        checked={isSelected}
        onChange={() => onChange(colorCode)}
        disabled={disabled}
      />
      <label htmlFor={`checkboxfilter-${colorCode}`}>
        {" "}
        <span className="checkbox-style"></span>
      </label>
    </div>
  );

  const Tooltip = ({ message }) => {
    if (!message) return null;

    return <div className="tooltip">{message}</div>;
  };

  const handleCardsPerPageChange = (newCardsPerPage) => {
    setCardsPerPage(newCardsPerPage);
    setCurrentPage(1);
  };
  const handleSelectChange = (value) => {
    handleCardsPerPageChange(parseInt(value, 10));
  };

  const handleSortOrderChange = (value) => {
    setSortOrder(value);
  };

  const handleCardSortChange = (value) => {
    sortCards(value);
    setSelectedSort(value);
    setSortOrder("asc");
  };

  const cardsPerPageOptions = [
    { value: "50", label: "50" },
    { value: "100", label: "100" },
    { value: "250", label: "250" },
    { value: "500", label: "500" },
    { value: "1000", label: "1000" },
  ];

  const sortOrderOptions = [
    { value: "asc", label: "Ascending" },
    { value: "desc", label: "Descending" },
  ];

  const cardSortOptions = [
    { value: "name", label: "Name" },
    { value: "cmc", label: "Mana Cost" },
    { value: "layout", label: "Layout (split, flip, transform, ...)" },
    {
      value: "color_identity",
      label: "Color (white, blue, black, red, green)",
    },
    { value: "rarity", label: "Rarity (common, uncommon, rare, ...)" },
  ];

  return (
    <>
      <div className="flex">
        <div className="flex flex-h">
          <div className="cards-per-page">
            <CustomSelect
              options={cardsPerPageOptions}
              onChange={handleSelectChange}
              value={cardsPerPage.toString()}
              disabled={totalCards < 51}
              placeholder="#"
            />
          </div>
          <div className="sort-order">
            <CustomSelect
              options={sortOrderOptions}
              onChange={handleSortOrderChange}
              value={sortOrder}
              disabled={!selectedSort}
              placeholder="Set sort order.."
            />
          </div>
        </div>
        {Pagination}
      </div>
      <div className="flex">
        <div className="sort-cards">
          <CustomSelect
            options={cardSortOptions}
            onChange={handleCardSortChange}
            value={selectedSort}
            disabled={displayedCards.length < 2}
            placeholder="Sort cards by.."
          />
        </div>
        <div className="spacer">
          {showTooltip && (
            <Tooltip message="At least one filter must be active" />
          )}
        </div>
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
                onChange={() => handleColorFilterChange(code)}
                isWhite={label === "white"}
                disabled={
                  disableElement ||
                  (displayedCards.length === 0 && filteredColors.length === 0)
                }
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
