"use client";

import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";
import { TourPrograms } from "@/components/site/tour-programs";
import { Facilities } from "@/components/site/facilities";
import { Reservation } from "@/components/site/reservation";
import { LocationContact } from "@/components/site/location-contact";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main>
          <Hero />
          <About />
          <TourPrograms />
          <Facilities />
          <Reservation />
          <LocationContact />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
