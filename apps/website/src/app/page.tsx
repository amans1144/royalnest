import { Navbar } from '../components/navbar';
import { Hero } from '../components/hero';
import { WhyInvest } from '../components/why-invest';
import { Amenities } from '../components/amenities';
import { PlotMap } from '../components/plot-map';
import { Locations } from '../components/locations';
import { Gallery } from '../components/gallery';
import { Contact } from '../components/contact';
import { Footer } from '../components/footer';
import { FloatingActions } from '../components/floating-actions';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhyInvest />
        <Amenities />
        <PlotMap />
        <Locations />
        <Gallery />
        <Contact />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
