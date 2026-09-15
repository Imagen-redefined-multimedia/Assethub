import Image from "next/image";
import Navbar from "./components/Home/Navbar";
import Header from "./components/Home/Header";

export default function Home() {
  return (
   <main>
    <Navbar/>
    <div>
      <Header/>
    </div>
   </main>
  );
}
