import { CardsContextProvider } from "./CardsContext.jsx";
import CardsDisplay from "./CardsDisplay";
import MTGlogo from "./assets/MTGlogoLight.png";
import "./App.css";

function App() {
  return (
    <>
      <div className="title">
        <img src={MTGlogo} alt="Magic The Gathering Logo" />
      </div>
      <CardsContextProvider>
        <CardsDisplay />
      </CardsContextProvider>
    </>
  );
}

export default App;
