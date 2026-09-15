import Image from "next/image";
import Navbar from "./components/Home/Navbar";
import Header from "./components/Home/Header";
import Features from "./components/Home/Features";

export default function Home() {
  return (
   <main>
    <Navbar/>
    <div>
      <Header/>
      <Features/>
    </div>
   </main>
  );
}
