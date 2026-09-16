
import Navbar from "./components/Home/Navbar";
import Header from "./components/Home/Header";
import Features from "./components/Home/Features";
import Solutions from "./components/Home/Solutions";
import About from "./components/Home/About";
import Pricing from "./components/Home/Pricing";
import Footer from "./components/Home/Footer";

export default function Home() {
  return (
   <main>
    <Navbar/>
    <div>
      <Header/>
      <Features/>
      <Solutions/>
      <Pricing/>
      <About/>
      <Footer/>
    </div>
   </main>
  );
}
