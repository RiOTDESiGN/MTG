import CardsDisplay from './CardsDisplay'
import MTGlogo from "./assets/MTGlogo.png";
import './App.css'

function App() {

  return (
    <>
    	<div className="title">
        <img src={MTGlogo} alt="Magic The Gathering Logo" />
      </div>
      <CardsDisplay />
    </>
  )
}

export default App