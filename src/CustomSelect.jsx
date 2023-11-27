import React, { useState, useEffect } from "react";

const CustomSelect = ({ options, onChange, value, disabled, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOptionLabel = value
    ? options.find((option) => option.value === value)?.label
    : placeholder;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && e.target.closest(".custom-select") === null) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectChange = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`custom-select ${disabled ? "disabled" : ""}`}>
      <div onClick={() => !disabled && setIsOpen(!isOpen)}>
        {selectedOptionLabel}
      </div>
      {isOpen && !disabled && (
        <ul className="selector-options">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelectChange(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
