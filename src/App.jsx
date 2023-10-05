import CardsDisplay from './CardsDisplay'
import MTGlogo from "./assets/MTGlogo.png";
import './App.css'

function App() {

  return (
    <>
    	<div className="title">
        <img src={MTGlogo} alt="" />
      </div>
      <CardsDisplay />
    </>
  )
}

export default App
