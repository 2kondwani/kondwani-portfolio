import React from 'react';
import Link from "next/link";

// Green Work Experiences Component
function GreenWorkExperiences() {
  return (
    <div className="rounded-3xl bg-[#76c043] w-full max-w-3xl mx-auto p-8 flex flex-col">
      {/* Header Section */}
      <div className="border-b border-black mb-6">
        <div className="flex justify-center mb-16">
          <div className="text-center">
            <h1 className="text-5xl font-serif italic mb-4 text-black">
              <span>Work</span><br />
              <span>Experiences &</span><br />
              <span>Internships</span>
            </h1>
            <p className="text-xl font-mono text-black">
              Lorem Ipsum Dolor Sit<br />
              Aenean Iaculis
            </p>
          </div>
        </div>
      </div>
      
      {/* Experience Items */}
      <div className="border-b border-black py-4">
        <h2 className="text-4xl text-black">Lorem Ipsum Dos</h2>
      </div>
      
      <div className="border-b border-black py-4">
        <h2 className="text-4xl text-black">Quise <span className="italic">Maximus</span> Rex</h2>
      </div>
      
      <div className="border-b border-black py-4">
        <h2 className="text-4xl text-black">Fermento 3</h2>
      </div>
      
      <div className="border-b border-black py-4">
        <h2 className="text-4xl text-black">Dolor Sit Amet</h2>
      </div>
      
      <div className="border-b border-black py-4">
        <h2 className="text-4xl text-black">Hac <span className="italic">Habitas</span> Platea</h2>
      </div>
    </div>
  );
}

// Main Academic Page
export default function Academic() {
  return (
    <main className="flex min-h-screen bg-[#f5f1e9] text-black font-serif">
      {/* Sidebar */}
      <div className="w-1/4 p-10">
        <ul className="space-y-4 text-lg">
          <li><Link href="/">home</Link></li>
          <li><Link href="/gallery">gallery</Link></li>
          <li><Link href="/academic">academic / work</Link></li>
          <li><Link href="/projects">projects</Link></li>
          <li><Link href="/more">more</Link></li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="w-3/4 p-10">
        <div className="max-w-3xl">
          {/* Insert the Green Work Experiences component here */}
          <GreenWorkExperiences />
          
          {/* The original experience entries could be placed below if needed */}
        </div>
      </div>
    </main>
  );
}